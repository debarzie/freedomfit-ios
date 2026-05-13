import SwiftUI
import HealthKit

// ─── MODELS ───────────────────────────────────────────────────────────────────

struct WorkoutEntry: Identifiable, Codable {
    let id: UUID
    let date: Date
    let durationMinutes: Double
    let avgHeartRate: Double
    let isHighIntensity: Bool
    let earnedMinutes: Double
    let activityType: String
    let source: String
}

// ─── HEALTHKIT MANAGER ────────────────────────────────────────────────────────

class HealthKitManager: ObservableObject {
    let store = HKHealthStore()

    @Published var workouts: [WorkoutEntry] = []
    @Published var authorized = false
    @Published var isLoading = false
    @Published var lastSynced: Date? = nil

    let readTypes: Set<HKObjectType> = [
        HKObjectType.workoutType(),
        HKObjectType.quantityType(forIdentifier: .heartRate)!
    ]

    func requestAuth() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        store.requestAuthorization(toShare: [], read: readTypes) { ok, _ in
            DispatchQueue.main.async {
                self.authorized = ok
                if ok { self.fetchWorkouts() }
            }
        }
    }

    func fetchWorkouts() {
        DispatchQueue.main.async { self.isLoading = true }

        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date())

        let query = HKSampleQuery(
            sampleType: .workoutType(),
            predicate: predicate,
            limit: 100,
            sortDescriptors: [sort]
        ) { _, samples, _ in
            guard let hkWorkouts = samples as? [HKWorkout] else {
                DispatchQueue.main.async { self.isLoading = false }
                return
            }

            let group = DispatchGroup()
            var entries: [WorkoutEntry] = []

            for wo in hkWorkouts {
                group.enter()
                self.fetchAvgHeartRate(for: wo) { hr in
                    let isHigh     = hr > 132
                    let durMins    = wo.duration / 60.0
                    let earned: Double
                    if isHigh {
                        earned = floor(durMins / 15.0) * 1.0
                    } else {
                        earned = floor(durMins / 20.0) * 0.25
                    }

                    let entry = WorkoutEntry(
                        id: UUID(),
                        date: wo.startDate,
                        durationMinutes: durMins,
                        avgHeartRate: hr,
                        isHighIntensity: isHigh,
                        earnedMinutes: earned,
                        activityType: wo.workoutActivityType.name,
                        source: wo.sourceRevision.source.name
                    )
                    entries.append(entry)
                    group.leave()
                }
            }

            group.notify(queue: .main) {
                self.workouts = entries.sorted { $0.date > $1.date }
                self.isLoading = false
                self.lastSynced = Date()
                self.exportJSON()
            }
        }

        store.execute(query)
    }

    private func fetchAvgHeartRate(for workout: HKWorkout, completion: @escaping (Double) -> Void) {
        let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let pred   = HKQuery.predicateForSamples(withStart: workout.startDate, end: workout.endDate)
        let query  = HKStatisticsQuery(
            quantityType: hrType,
            quantitySamplePredicate: pred,
            options: .discreteAverage
        ) { _, stats, _ in
            let bpm = stats?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min")) ?? 0
            completion(bpm)
        }
        store.execute(query)
    }

    // Exports verified workout JSON to Documents folder
    // The FreedomFit PWA reads this via URL scheme
    func exportJSON() {
        guard let data = try? JSONEncoder().encode(workouts) else { return }
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let url = dir.appendingPathComponent("ff_workouts.json")
            try? data.write(to: url)
        }
        // Also store in UserDefaults for quick access
        UserDefaults.standard.set(data, forKey: "ff_verified_workouts")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "ff_last_sync")
    }
}

// ─── ACTIVITY TYPE EXTENSION ──────────────────────────────────────────────────

extension HKWorkoutActivityType {
    var name: String {
        switch self {
        case .running:           return "Laufen"
        case .cycling:           return "Radfahren"
        case .swimming:          return "Schwimmen"
        case .walking:           return "Gehen"
        case .hiking:            return "Wandern"
        case .traditionalStrengthTraining: return "Krafttraining"
        case .functionalStrengthTraining:  return "Functional Training"
        case .highIntensityIntervalTraining: return "HIIT"
        case .yoga:              return "Yoga"
        case .dance:             return "Tanzen"
        case .elliptical:        return "Ellipsentrainer"
        case .rowing:            return "Rudern"
        case .stairClimbing:     return "Treppensteigen"
        case .crossTraining:     return "Cross Training"
        default:                 return "Training"
        }
    }
}

// ─── CONTENT VIEW ─────────────────────────────────────────────────────────────

struct ContentView: View {
    @StateObject var hk = HealthKitManager()

    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "080810").ignoresSafeArea()

                if !hk.authorized {
                    AuthView(hk: hk)
                } else {
                    WorkoutListView(hk: hk)
                }
            }
        }
        .preferredColorScheme(.dark)
        .onAppear { hk.requestAuth() }
    }
}

// ─── AUTH VIEW ────────────────────────────────────────────────────────────────

struct AuthView: View {
    @ObservedObject var hk: HealthKitManager

    var body: some View {
        VStack(spacing: 28) {
            Spacer()

            ZStack {
                Circle()
                    .fill(Color(hex: "a78bfa").opacity(0.15))
                    .frame(width: 100, height: 100)
                Image(systemName: "lock.open.fill")
                    .font(.system(size: 44))
                    .foregroundColor(Color(hex: "a78bfa"))
            }

            VStack(spacing: 10) {
                Text("FreedomFit")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(Color(hex: "a78bfa"))

                Text("HEALTH SYNC")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(4)
                    .foregroundColor(Color(hex: "4e5270"))
            }

            Text("FreedomFit liest deine Apple Watch Trainingsdaten und berechnet daraus verifizierte Freiheitsminuten.")
                .font(.system(size: 14))
                .foregroundColor(Color(hex: "6b7280"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            VStack(spacing: 10) {
                infoRow(icon: "checkmark.shield.fill", color: "34d399",
                        text: "Nur lesen – keine Daten werden verändert")
                infoRow(icon: "applewatch", color: "a78bfa",
                        text: "Automatisch von Apple Watch synchronisiert")
                infoRow(icon: "heart.fill", color: "f472b6",
                        text: "Herzfrequenz bestimmt die Intensität")
            }
            .padding(.horizontal, 28)

            Button {
                hk.requestAuth()
            } label: {
                Text("Health-Zugriff erlauben")
                    .font(.system(size: 15, weight: .semibold))
                    .tracking(1)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "a78bfa"), Color(hex: "7c3aed")],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .cornerRadius(14)
                    .shadow(color: Color(hex: "7c3aed").opacity(0.4), radius: 12, y: 4)
            }
            .padding(.horizontal, 24)

            Spacer()
        }
    }

    func infoRow(icon: String, color: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(hex: color))
                .frame(width: 22)
            Text(text)
                .font(.system(size: 13))
                .foregroundColor(Color(hex: "6b7280"))
            Spacer()
        }
    }
}

// ─── WORKOUT LIST VIEW ────────────────────────────────────────────────────────

struct WorkoutListView: View {
    @ObservedObject var hk: HealthKitManager

    let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        f.locale = Locale(identifier: "de_DE")
        return f
    }()

    var totalEarned: Double {
        hk.workouts.reduce(0) { $0 + $1.earnedMinutes }
    }

    var body: some View {
        ZStack {
            Color(hex: "080810").ignoresSafeArea()

            VStack(spacing: 0) {
                // Summary card
                VStack(spacing: 6) {
                    Text("VERIFIZIERTE FREIHEIT")
                        .font(.system(size: 10, weight: .semibold))
                        .tracking(3)
                        .foregroundColor(Color(hex: "4e5270"))

                    Text(formatMinutes(totalEarned))
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(Color(hex: "fbbf24"))

                    Text("letzte 30 Tage · \(hk.workouts.count) Trainings")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "4e5270"))

                    if let last = hk.lastSynced {
                        Text("Synchronisiert: \(dateFormatter.string(from: last))")
                            .font(.system(size: 11))
                            .foregroundColor(Color(hex: "34d399"))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(20)
                .background(Color(hex: "0f0f1a"))
                .overlay(
                    Rectangle()
                        .frame(height: 1)
                        .foregroundColor(Color(hex: "a78bfa").opacity(0.3)),
                    alignment: .bottom
                )

                // Workout list
                if hk.isLoading {
                    Spacer()
                    ProgressView()
                        .tint(Color(hex: "a78bfa"))
                    Text("Lade Trainings…")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "4e5270"))
                        .padding(.top, 8)
                    Spacer()
                } else if hk.workouts.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "figure.run")
                            .font(.system(size: 40))
                            .foregroundColor(Color(hex: "4e5270"))
                        Text("Keine Trainings gefunden")
                            .foregroundColor(Color(hex: "4e5270"))
                        Text("Stelle sicher dass deine Apple Watch\nTrainings in Apple Health synchronisiert sind.")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "4e5270").opacity(0.7))
                            .multilineTextAlignment(.center)
                    }
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(hk.workouts) { wo in
                                WorkoutRow(workout: wo, formatter: dateFormatter)
                            }
                        }
                        .padding(16)
                    }
                }
            }
        }
        .navigationTitle("FreedomFit Sync")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    hk.fetchWorkouts()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(Color(hex: "a78bfa"))
                }
            }
        }
    }

    func formatMinutes(_ m: Double) -> String {
        if m < 1 { return "\(Int(m * 60))s" }
        let whole = Int(m)
        let secs  = Int((m - Double(whole)) * 60)
        return secs > 0 ? "\(whole)m \(secs)s" : "\(whole)m"
    }
}

// ─── WORKOUT ROW ──────────────────────────────────────────────────────────────

struct WorkoutRow: View {
    let workout: WorkoutEntry
    let formatter: DateFormatter

    var body: some View {
        HStack(spacing: 14) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(workout.isHighIntensity
                          ? Color(hex: "a78bfa").opacity(0.15)
                          : Color(hex: "1e1e30"))
                    .frame(width: 44, height: 44)
                Text(workout.isHighIntensity ? "🔥" : "🚶")
                    .font(.system(size: 20))
            }

            // Info
            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(workout.activityType)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                    if workout.isHighIntensity {
                        Text("HIGH")
                            .font(.system(size: 10, weight: .bold))
                            .tracking(1)
                            .foregroundColor(Color(hex: "a78bfa"))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: "a78bfa").opacity(0.15))
                            .cornerRadius(4)
                    }
                }
                Text(formatter.string(from: workout.date))
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "4e5270"))

                HStack(spacing: 10) {
                    Label("\(Int(workout.durationMinutes)) Min", systemImage: "clock")
                    Label("\(Int(workout.avgHeartRate)) BPM", systemImage: "heart.fill")
                        .foregroundColor(workout.isHighIntensity
                                         ? Color(hex: "f472b6")
                                         : Color(hex: "4e5270"))
                }
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "4e5270"))
            }

            Spacer()

            // Earned
            VStack(alignment: .trailing, spacing: 2) {
                Text("+\(formatMin(workout.earnedMinutes))")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(Color(hex: "fbbf24"))
                Text("Freiheit")
                    .font(.system(size: 10))
                    .foregroundColor(Color(hex: "4e5270"))
            }
        }
        .padding(14)
        .background(Color(hex: "0f0f1a"))
        .overlay(
            RoundedRectangle(cornerRadius: 13)
                .stroke(Color(hex: "252538"), lineWidth: 1)
        )
        .cornerRadius(13)
    }

    func formatMin(_ m: Double) -> String {
        if m < 1 { return "\(Int(m * 60))s" }
        let w = Int(m); let s = Int((m - Double(w)) * 60)
        return s > 0 ? "\(w)m\(s)s" : "\(w)m"
    }
}

// ─── COLOR EXTENSION ──────────────────────────────────────────────────────────

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 08) & 0xFF) / 255
        let b = Double((int >> 00) & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

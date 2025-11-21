//
//  ContentView.swift
//  FoodForThoughtHealth
//
//  Main view of the app
//

import SwiftUI
import HealthKit

struct ContentView: View {
    
    // Health manager
    @StateObject private var healthManager = HealthKitManager.shared
    
    // UI state
    @State private var isSyncing = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var alertTitle = ""
    @State private var autoSyncEnabled = true
    
    // Timer for auto-sync
    @State private var syncTimer: Timer?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    
                    // Header
                    headerView
                    
                    // Authorization section
                    if !healthManager.isAuthorized {
                        authorizationSection
                    } else {
                        // Health summary
                        healthSummarySection
                        
                        // Sync section
                        syncSection
                        
                        // Auto-sync toggle
                        autoSyncToggle
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Food For Thought")
            .navigationBarTitleDisplayMode(.inline)
            .alert(alertTitle, isPresented: $showAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .onAppear {
                setupAutoSync()
            }
            .onDisappear {
                syncTimer?.invalidate()
            }
        }
    }
    
    // MARK: - Header View
    
    private var headerView: some View {
        VStack(spacing: 10) {
            Image(systemName: "heart.circle.fill")
                .resizable()
                .frame(width: 80, height: 80)
                .foregroundColor(.red)
            
            Text("Apple Watch Health Sync")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("Sync your health data to the cloud")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical)
    }
    
    // MARK: - Authorization Section
    
    private var authorizationSection: some View {
        VStack(spacing: 15) {
            Image(systemName: "lock.shield")
                .resizable()
                .frame(width: 60, height: 60)
                .foregroundColor(.blue)
            
            Text("HealthKit Access Required")
                .font(.headline)
            
            Text("This app needs permission to read your health data from Apple Watch")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: requestAuthorization) {
                HStack {
                    Image(systemName: "checkmark.shield")
                    Text("Request HealthKit Access")
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.blue)
                .cornerRadius(12)
            }
            .padding(.horizontal)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    // MARK: - Health Summary Section
    
    private var healthSummarySection: some View {
        VStack(spacing: 15) {
            Text("Today's Health Data")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // Heart Rate
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .frame(width: 30)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Heart Rate")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    if let hr = healthManager.healthSummary.latestHeartRate {
                        Text("\(hr) BPM")
                            .font(.title2)
                            .fontWeight(.bold)
                    } else {
                        Text("No data")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Steps
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.green)
                    .frame(width: 30)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Steps")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text("\(healthManager.healthSummary.todaySteps)")
                        .font(.title2)
                        .fontWeight(.bold)
                }
                
                Spacer()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Calories & Activities
            HStack(spacing: 15) {
                // Calories
                VStack(spacing: 8) {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                        .font(.title2)
                    
                    Text("\(healthManager.healthSummary.todayCalories)")
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    Text("Calories")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                
                // Activities
                VStack(spacing: 8) {
                    Image(systemName: "figure.run")
                        .foregroundColor(.blue)
                        .font(.title2)
                    
                    Text("\(healthManager.healthSummary.todayActivities)")
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    Text("Activities")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Sync Section
    
    private var syncSection: some View {
        VStack(spacing: 15) {
            // Last sync info
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.secondary)
                
                Text("Last sync: \(healthManager.healthSummary.lastSyncDescription)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
            }
            .padding(.horizontal)
            
            // Sync button
            Button(action: syncHealthData) {
                HStack {
                    if isSyncing {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        Text("Syncing...")
                    } else {
                        Image(systemName: "arrow.triangle.2.circlepath")
                        Text("Sync Health Data")
                    }
                }
                .font(.headline)
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(isSyncing ? Color.gray : Color.blue)
                .cornerRadius(12)
            }
            .disabled(isSyncing)
            .padding(.horizontal)
            
            // Test connection button
            Button(action: testBackendConnection) {
                HStack {
                    Image(systemName: "network")
                    Text("Test Backend Connection")
                }
                .font(.subheadline)
                .foregroundColor(.blue)
            }
        }
    }
    
    // MARK: - Auto Sync Toggle
    
    private var autoSyncToggle: some View {
        VStack(spacing: 10) {
            Toggle(isOn: $autoSyncEnabled) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Auto-sync (every 15 min)")
                        .font(.subheadline)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .onChange(of: autoSyncEnabled) { enabled in
                if enabled {
                    setupAutoSync()
                } else {
                    syncTimer?.invalidate()
                }
            }
            
            Text("Enable to automatically sync health data in the background")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
        }
    }
    
    // MARK: - Actions
    
    private func requestAuthorization() {
        healthManager.requestAuthorization { success, error in
            if success {
                showAlertMessage(title: "Success", message: "HealthKit access granted! You can now sync your health data.")
                
                // Enable background delivery
                healthManager.enableBackgroundDelivery { success, error in
                    if !success {
                        print("Background delivery setup failed: \(error?.localizedDescription ?? "Unknown error")")
                    }
                }
            } else {
                showAlertMessage(
                    title: "Authorization Failed",
                    message: error?.localizedDescription ?? "Please enable HealthKit access in Settings"
                )
            }
        }
    }
    
    private func syncHealthData() {
        guard !isSyncing else { return }
        
        isSyncing = true
        
        // Fetch all health data
        healthManager.fetchAllDataForSync { healthData, error in
            if let error = error {
                isSyncing = false
                showAlertMessage(title: "Sync Failed", message: error.localizedDescription)
                return
            }
            
            guard let healthData = healthData else {
                isSyncing = false
                showAlertMessage(title: "No Data", message: "No health data available to sync")
                return
            }
            
            // Send to backend
            APIService.shared.syncHealthData(healthData) { result in
                isSyncing = false
                
                switch result {
                case .success(let response):
                    showAlertMessage(
                        title: "Sync Successful",
                        message: "Synced \(response.synced?.heartRates ?? 0) heart rates, \(response.synced?.activities ?? 0) activities, and \(response.synced?.steps ?? 0) step entries"
                    )
                    
                case .failure(let error):
                    showAlertMessage(
                        title: "Sync Failed",
                        message: "Failed to sync data: \(error.localizedDescription)\n\nMake sure the backend is running."
                    )
                }
            }
        }
    }
    
    private func testBackendConnection() {
        APIService.shared.testConnection { result in
            switch result {
            case .success(let isConnected):
                if isConnected {
                    showAlertMessage(title: "Connection Success", message: "Backend is reachable and running!")
                } else {
                    showAlertMessage(title: "Connection Failed", message: "Backend returned an error")
                }
                
            case .failure(let error):
                showAlertMessage(
                    title: "Connection Failed",
                    message: "Cannot reach backend:\n\(error.localizedDescription)\n\nMake sure:\n1. Flask backend is running\n2. API URL is correct in APIService.swift\n3. iPhone and Mac are on same network"
                )
            }
        }
    }
    
    private func setupAutoSync() {
        guard autoSyncEnabled else { return }
        
        // Sync immediately
        syncHealthData()
        
        // Set up timer for periodic sync (every 15 minutes)
        syncTimer?.invalidate()
        syncTimer = Timer.scheduledTimer(withTimeInterval: 900, repeats: true) { _ in
            syncHealthData()
        }
    }
    
    private func showAlertMessage(title: String, message: String) {
        alertTitle = title
        alertMessage = message
        showAlert = true
    }
}

// MARK: - Preview

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

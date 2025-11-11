import UIKit
import React

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var bridge: RCTBridge?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize bridge with delegate to ensure all native modules (including Reanimated) are loaded
    bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    
    guard let bridge = bridge else {
      return false
    }
    
    // Ensure all native modules are initialized before creating root view
    // This is especially important for Reanimated in brownfield apps
    RCTSetLogThreshold(.info)
    
    let rootView = RCTRootView(
      bridge: bridge,
      moduleName: "TimelineApp",
      initialProperties: nil
    )

    // Set background color to match app theme
    rootView.backgroundColor = UIColor(red: 0.1, green: 0.1, blue: 0.18, alpha: 1.0) // #1A1A2E
    
    // Ensure rootView fills entire screen
    rootView.frame = UIScreen.main.bounds
    rootView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Get the full screen bounds, accounting for safe areas
    let screenBounds = UIScreen.main.bounds
    
    window = UIWindow(frame: screenBounds)
    
    // Ensure window uses full screen
    if #available(iOS 13.0, *) {
      if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
        window = UIWindow(windowScene: windowScene)
        window?.frame = windowScene.coordinateSpace.bounds
      }
    }
    
    // Fallback to main bounds if window scene not available
    if window?.frame == .zero {
      window?.frame = screenBounds
    }
    
    let rootViewController = UIViewController()
    
    // Ensure rootViewController view fills entire screen
    rootViewController.view = rootView
    rootViewController.view.backgroundColor = UIColor(red: 0.1, green: 0.1, blue: 0.18, alpha: 1.0)
    rootViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    
    // Ensure window fills entire screen
    window?.backgroundColor = UIColor(red: 0.1, green: 0.1, blue: 0.18, alpha: 1.0)
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()
    
    // Force layout update
    window?.layoutIfNeeded()
    
    return true
  }
}

extension AppDelegate: RCTBridgeDelegate {
  func sourceURL(for bridge: RCTBridge) -> URL? {
#if DEBUG
    // Try to get bundle URL from RCTBundleURLProvider first
    if let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") {
      return url
    }
    
    // Fallback: construct bundle URL explicitly
    // For iOS Simulator, use localhost; for device, you'd need the computer's IP
    let bundleURLString = "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false"
    return URL(string: bundleURLString)
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

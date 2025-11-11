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

    if #available(iOS 13.0, *) {
      rootView.backgroundColor = UIColor.systemBackground
    } else {
      rootView.backgroundColor = UIColor.white
    }

    window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = UIViewController()
    rootViewController.view = rootView
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()
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

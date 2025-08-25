# PodWatch

<div align="center">
  <img src="src/icons/podwatch-primary.svg" alt="PodWatch Logo" width="128" height="128">
</div>
<br/>

[![Release](https://img.shields.io/badge/Release-v1.0.0--beta.1-green.svg)](https://github.com/richardng/podwatch/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-37.3.1-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5.4-blue.svg)](https://www.typescriptlang.org/)

A lightweight, user-friendly Kubernetes pod log streaming GUI built with Electron and React. Designed for developers who need quick access to cluster information and pod logs without the complexity of command-line tools.

👷 **Note**: This tool complements your existing Kubernetes workflow and is not intended to replace kubectl for advanced operations.

<div align="center">
  <a href="https://github.com/richardng/podwatch/releases/latest">
    <img src="download-for-mac-apple-silicon-button.svg" alt="Download for Mac - Apple Silicon" width="210" height="56">
  </a>
</div>

## ✨ Features

### Core Functionality

- 🔄 **Context Management**: View and switch between Kubernetes contexts seamlessly
- 📦 **Pod Searching**: Browse pods across namespaces with real-time status updates
- 📋 **Log Streaming**: Stream and search pod logs with one-click copy functionality
- 🔍 **Namespace Filtering**: Filter pods by namespace for better organization
- ⏰ **Real-time Updates**: Live pod status and log streaming

### User Experience

- 🖥️ **Desktop Native**: Cross-platform Electron application
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 🚀 **No Setup Required**: No registration, no configuration files
- 📱 **Intuitive Design**: Point-and-click interface for common Kubernetes tasks

## 🚀 Getting Started

**Installation Steps:**

1. Click the download button above to get the latest DMG file
2. Open the downloaded DMG file
3. Drag PodWatch to your Applications folder
4. Launch PodWatch from Applications or Spotlight

### Prerequisites

- macOS 10.15 (Catalina) or later
- kubectl configured with access to your Kubernetes clusters
- Valid kubeconfig file (typically located at `~/.kube/config`)

### First Launch

1. Open PodWatch
2. The app will automatically detect your kubeconfig contexts
3. Select a context from the dropdown to start exploring your cluster
4. Choose a namespace and browse your pods
5. Click on any pod to view its logs

> **Note**: PodWatch reads your existing kubectl configuration. No additional setup required!

## 🎯 Use Cases

- **Development Teams**: Quick access to staging/development cluster information
- **DevOps Engineers**: Rapid troubleshooting and log analysis
- **Kubernetes Beginners**: GUI-first approach to cluster management
- **Multi-cluster Management**: Easy context switching between different environments

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Desktop Framework**: Electron 37
- **Kubernetes Integration**: @kubernetes/client-node
- **Build System**: Webpack, Electron Forge
- **Icons**: Lucide React

## ⚙️ How It Works Behind the Scenes

### Architecture & Execution Flow

```mermaid
graph TD
    A["User Interface<br/>(React App)"] --> B["IPC Communication"]
    B --> C["Main Process<br/>(Node.js/Electron)"]

    C --> D["Setup AWS CLI Path<br/>(/usr/local/bin, /opt/homebrew/bin)"]
    D --> E["Load Kubeconfig<br/>(~/.kube/config)"]

    E --> F{"Authentication Type"}
    F -->|EKS Clusters| G["Spawn AWS CLI<br/>(aws eks get-token)"]
    F -->|Other Clusters| H["Certificate/Token Auth"]

    G --> I["Kubernetes API Client<br/>(@kubernetes/client-node)"]
    H --> I

    I --> J{"Operation Type"}
    J -->|List Pods| K["k8s.CoreV1Api<br/>listPodForAllNamespaces()"]
    J -->|Stream Logs| L["Spawn Process<br/>(kubectl logs -f)"]
    J -->|Switch Context| M["Update Context<br/>(in-memory only)"]

    K --> N["Return Pod Data"]
    L --> O["Stream Log Data"]
    M --> P["Return Success"]

    N --> B
    O --> B
    P --> B
```

### Key Points

- **Electron Architecture**: Main process handles Kubernetes operations, renderer process manages UI
- **Authentication**: Automatically detects and uses AWS CLI for EKS clusters, supports all kubectl auth methods
- **Path Resolution**: Searches common installation paths for required binaries (aws, kubectl)
- **Read-Only**: Only retrieves cluster information, never modifies resources
- **Local Operations**: Uses your existing kubeconfig and credentials, no external data transmission

### Common Troubleshooting

| Issue              | Cause                      | Solution                                                               |
| ------------------ | -------------------------- | ---------------------------------------------------------------------- |
| "spawn aws ENOENT" | AWS CLI not in PATH        | App auto-detects AWS CLI paths. Ensure `aws --version` works           |
| No contexts found  | Missing/invalid kubeconfig | Verify `~/.kube/config` exists and `kubectl config get-contexts` works |
| Connection errors  | Network/firewall issues    | Same requirements as kubectl - ensure cluster endpoints are accessible |

## 📋 Current Limitations

PodWatch is designed as a **read-only cluster viewer** and **log streaming tool**. It currently does not support:

- Creating or modifying Kubernetes resources
- Cluster provisioning or management
- Pod deployment or scaling operations
- Advanced kubectl operations

For these operations, please continue using `kubectl` or other specialized tools.

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements, your help is appreciated.

### Development Setup

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/your-username/podwatch.git
cd podwatch
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm start
```

5. Build for production:

```bash
# Package the app
npm run package

# Create distributable
npm run make
```

### Development Prerequisites

- Node.js (v16 or higher)
- kubectl configured with access to your Kubernetes clusters
- Valid kubeconfig file

### Contributing Process

1. Create your feature branch (`git checkout -b feature/amazing-feature`)
2. Make your changes and test them
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please see our [Contributing Guidelines](CONTRIBUTING.md) for more detailed information.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Richard Ng** - [richard.ng.cccc@gmail.com](mailto:richard.ng.cccc@gmail.com)

## 🙏 Acknowledgments

- Built with ❤️ using Electron and React
- Icons provided by [Lucide](https://lucide.dev/)
- Kubernetes client integration via [@kubernetes/client-node](https://github.com/kubernetes-client/javascript)

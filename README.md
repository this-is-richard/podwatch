# K8s Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-37.3.1-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5.4-blue.svg)](https://www.typescriptlang.org/)

A lightweight, user-friendly Kubernetes cluster management GUI built with Electron and React. Designed for developers who need quick access to cluster information and pod logs without the complexity of command-line tools.

## ✨ Features

### Core Functionality

- 🔄 **Context Management**: View and switch between Kubernetes contexts seamlessly
- 📦 **Pod Monitoring**: Browse pods across namespaces with real-time status updates
- 📋 **Log Streaming**: Stream and search pod logs with one-click copy functionality
- 🔍 **Namespace Filtering**: Filter pods by namespace for better organization
- ⏰ **Real-time Updates**: Live pod status and log streaming

### User Experience

- 🖥️ **Desktop Native**: Cross-platform Electron application
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 🚀 **No Setup Required**: No registration, no configuration files
- 📱 **Intuitive Design**: Point-and-click interface for common Kubernetes tasks

## 🚀 Getting Started

### Download & Install

**macOS Users:**

1. Download the latest release: [K8s Manager v1.0.0.dmg](https://github.com/your-username/k8s-manager/releases/latest)
2. Open the DMG file and drag K8s Manager to your Applications folder
3. Launch K8s Manager from Applications or Spotlight

### Prerequisites

- macOS 10.15 (Catalina) or later
- kubectl configured with access to your Kubernetes clusters
- Valid kubeconfig file (typically located at `~/.kube/config`)

### First Launch

1. Open K8s Manager
2. The app will automatically detect your kubeconfig contexts
3. Select a context from the dropdown to start exploring your cluster
4. Choose a namespace and browse your pods
5. Click on any pod to view its logs

> **Note**: K8s Manager reads your existing kubectl configuration. No additional setup required!

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

## 📋 Current Limitations

K8s Manager is designed as a **read-only cluster viewer** and **log monitoring tool**. It currently does not support:

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
git clone https://github.com/your-username/k8s-manager.git
cd k8s-manager
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

---

**Note**: This tool complements your existing Kubernetes workflow and is not intended to replace kubectl for advanced operations.

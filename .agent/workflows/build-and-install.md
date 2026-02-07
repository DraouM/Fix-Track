---
description: how to build and install the application
---

1. Ensure all dependencies are installed (Rust, Node.js, C++ Build Tools).
2. Open a terminal in the project root.
3. Run the following command to build the production installer:
```bash
npm run tauri build
```
4. Navigate to `src-tauri/target/release/bundle/msi/` or `src-tauri/target/release/bundle/nsis/`.
5. Run the generated `.msi` or `.exe` file to install the application.

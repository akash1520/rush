"""
Next.js project initialization service.
Creates Next.js project structure with Tailwind CSS.
"""
import json
from pathlib import Path
from typing import Optional

from app.services.storage import get_project_storage_path


async def is_nextjs_project(project_id: str) -> bool:
    """Check if a project is already a Next.js project."""
    project_dir = get_project_storage_path(project_id)
    package_json = project_dir / "package.json"

    if not package_json.exists():
        return False

    try:
        with open(package_json, 'r') as f:
            package_data = json.load(f)
            dependencies = package_data.get('dependencies', {})
            return 'next' in dependencies
    except Exception:
        return False


async def has_typescript_files(project_id: str) -> bool:
    """Check if project has TypeScript files."""
    project_dir = get_project_storage_path(project_id)

    # Check for common TypeScript files
    ts_files = list(project_dir.rglob("*.ts")) + list(project_dir.rglob("*.tsx"))
    return len(ts_files) > 0


async def initialize_nextjs_project(project_id: str) -> bool:
    """
    Initialize a Next.js project with Tailwind CSS.
    Returns True if successful, False otherwise.
    """
    project_dir = get_project_storage_path(project_id)

    # Check if already initialized
    if await is_nextjs_project(project_id):
        return True

    try:
        # Create app directory
        app_dir = project_dir / "app"
        app_dir.mkdir(exist_ok=True)

        # Create components directory
        components_dir = app_dir / "components"
        components_dir.mkdir(exist_ok=True)

        # Create public directory
        public_dir = project_dir / "public"
        public_dir.mkdir(exist_ok=True)

        # Determine if TypeScript should be used
        use_typescript = await has_typescript_files(project_id)
        ext = "tsx" if use_typescript else "jsx"

        # Create package.json
        package_json_content = {
            "name": f"project-{project_id}",
            "version": "0.1.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
            },
            "dependencies": {
                "next": "^14.2.5",
                "react": "^18.3.1",
                "react-dom": "^18.3.1"
            },
            "devDependencies": {
                "@types/node": "^20",
                "@types/react": "^18",
                "@types/react-dom": "^18",
                "autoprefixer": "^10.4.20",
                "postcss": "^8.4.47",
                "tailwindcss": "^3.4.10",
                "typescript": "^5.5.4" if use_typescript else None,
                "eslint": "^8",
                "eslint-config-next": "^14.2.5"
            }
        }

        # Remove None values
        if not use_typescript:
            package_json_content["devDependencies"].pop("typescript", None)

        package_json_path = project_dir / "package.json"
        with open(package_json_path, 'w') as f:
            json.dump(package_json_content, f, indent=2)

        # Create next.config.js
        next_config_content = """/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
"""
        next_config_path = project_dir / "next.config.js"
        with open(next_config_path, 'w') as f:
            f.write(next_config_content)

        # Create tailwind.config.js
        tailwind_config_content = """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"""
        tailwind_config_path = project_dir / "tailwind.config.js"
        with open(tailwind_config_path, 'w') as f:
            f.write(tailwind_config_content)

        # Create postcss.config.js
        postcss_config_content = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
        postcss_config_path = project_dir / "postcss.config.js"
        with open(postcss_config_path, 'w') as f:
            f.write(postcss_config_content)

        # Create tsconfig.json if TypeScript
        if use_typescript:
            # Use a proper Next.js tsconfig.json template
            tsconfig_content = """{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"""
            tsconfig_path = project_dir / "tsconfig.json"
            with open(tsconfig_path, 'w') as f:
                f.write(tsconfig_content)

        # Create .gitignore
        gitignore_content = """# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
"""
        gitignore_path = project_dir / ".gitignore"
        with open(gitignore_path, 'w') as f:
            f.write(gitignore_content)

        # Create app/layout.tsx (or .jsx)
        layout_content = f"""import './globals.css'
import type {{ Metadata }} from 'react'

export const metadata: Metadata = {{
  title: 'Next.js App',
  description: 'Generated with AI',
}}

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode
}}) {{
  return (
    <html lang="en">
      <body>{{children}}</body>
    </html>
  )
}}
"""
        if not use_typescript:
            layout_content = """import './globals.css'

export const metadata = {
  title: 'Next.js App',
  description: 'Generated with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
"""

        layout_path = app_dir / f"layout.{ext}"
        if not layout_path.exists():
            with open(layout_path, 'w') as f:
                f.write(layout_content)

        # Create app/globals.css
        globals_css_content = """@tailwind base;
@tailwind components;
@tailwind utilities;
"""
        globals_css_path = app_dir / "globals.css"
        if not globals_css_path.exists():
            with open(globals_css_path, 'w') as f:
                f.write(globals_css_content)

        # Create app/page.tsx (or .jsx) if it doesn't exist
        page_content = f"""export default function Home() {{
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Next.js</h1>
        <p className="text-gray-600">Start editing app/page.{ext} to see changes.</p>
      </div>
    </main>
  )
}}
"""
        page_path = app_dir / f"page.{ext}"
        if not page_path.exists():
            with open(page_path, 'w') as f:
                f.write(page_content)

        return True

    except Exception as e:
        print(f"Error initializing Next.js project: {e}")
        return False


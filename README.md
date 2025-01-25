# Codelab Circle Project

Tech Stack

- Nextjs (React) w/ app router
- shadcn/ui
- Tailwind
- pnpm

## Setting up your local development environment

To set up your development environment for the Codelab Circle project, follow these steps:

1. **Install Git**:

   - Download and install Git from [git-scm.com](https://git-scm.com/).
   - Follow the installation instructions for your operating system.

2. **Install Node.js**:

   - Download and install Node.js from [nodejs.org](https://nodejs.org/).
   - Ensure you install the LTS version for better stability.

3. **Verify npm Installation**:

   - After installing Node.js, verify that `npm` is installed by running:
     ```bash
     npm -v
     ```
   - If `npm` is not installed, you can install it separately by following the instructions on the [npm website](https://www.npmjs.com/get-npm).

4. **Install pnpm**:

   - After confirming that `npm` is installed, open your terminal and run the following command to install `pnpm` globally:
     ```bash
     npm install -g pnpm
     ```

5. **Clone the Repository**:

   - Use Git to clone the repository to your local machine:
     ```bash
     git clone https://github.com/Codelab-Davis/circle.git
     ```

6. **Navigate to the Project Directory**:

   - Change into the project directory:
     ```bash
     cd circle
     ```
   - Open the project in your code editor (VSCode etc)

7. **Install Dependencies**:

   - Run the following command to install the project dependencies:
     ```bash
     pnpm install
     ```

8. **Run the Development Server**:

   - Start the development server with:
     ```bash
     pnpm dev
     ```
   - Open your browser and navigate to `http://localhost:3000` to view the application.

9. **Code Changes**:

   - You can now make changes to the code. The development server will automatically reload the application when you save your changes.

## Contributing

- **Never push directly to the main branch.**

Any time you want to work on a new feature, ticket, bug fix, etc., follow these steps:

1. Checkout the main branch:

   ```bash
   git checkout main
   ```

2. Pull the latest changes:

   ```bash
   git pull
   ```

3. Create a new branch from main called `[feature-name]`:

   ```bash
   git checkout -b feature-name
   ```

4. Do your work locally, then commit and push your changes:

   ```bash
   git add .
   git commit -m "Your commit message"
   git push -u origin feature-name
   ```

5. On GitHub, click the button to create a Pull Request (PR) from your branch and create the PR.

6. Keep contributing to this branch/PR and pushing your changes.

7. If you're done and GitHub Actions tests pass:

   - Go to the Slack channel and request a PR review from at least one other developer.
   - If the PR is approved, you can merge it into the main branch.

8. Vercel will automatically create preview deployments with a URL for each PR, which will be added as a comment on the PR. You can share this preview deployment with other developers and/or the client during the PR approval process.

9. Finally, locally checkout back to main and pull to ensure you're up to date:
   ```bash
   git checkout main
   git pull
   ```

## Tech Stack Crash Course

### Next.js

Next.js is a React framework that provides features such as server-side rendering and generating static websites.

Key features:

- **File-based Routing**: Next.js uses a file-system based router built on the concept of pages.

  - Pages are associated with a route based on their file name. For example, `pages/about.js` is mapped to `/about`.
  - In the App Router (which we're using), you create routes by adding folders to the `app` directory. The UI for each route is defined by a `page.js` file inside the folder.

- **Server-Side Rendering (SSR)**: Next.js can render React components on the server before sending them to the client.

- **API Routes**: Next.js allows you to create API endpoints as Node.js serverless functions.

Usage example:

```
// app/page.tsx
export default function Home() {
  return <h1>Welcome to Next.js!</h1>
}
```

### shadcn/ui

shadcn/ui is a collection of re-usable components built using Radix UI and Tailwind CSS.

Key features:

- Pre-built, accessible components
- Customizable with Tailwind CSS
- Copy and paste the components you need

Usage:

1. Add components as needed:

```
pnpm dlx shadcn@latest add button
```

2. Use the component in your code:

```
import { Button } from "@/components/ui/button"

export default function Home() {
  return <Button>Click me</Button>
}
```

### Tailwind CSS

Tailwind CSS is a utility-first CSS framework that allows you to rapidly build custom user interfaces.

Key features:

- Utility classes for styling
- Highly customizable
- Responsive design out of the box

Usage example:

```
<div className="p-4 m-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">
  This is a Tailwind styled div
</div>
```

### pnpm

pnpm is a fast, disk space efficient package manager that uses a content-addressable filesystem to store all files from all modules on disk.

Key commands:

- Install dependencies: `pnpm install`
- Add a dependency: `pnpm add [package-name]`

Example usage:

```
# Install project dependencies
pnpm install

# Add a new package
pnpm add react-icons

# Run the development server
pnpm dev

# Build the project
pnpm build
```

For more detailed information on each technology, refer to their official documentation:

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Documentation](https://pnpm.io/)

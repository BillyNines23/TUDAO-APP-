# TUDAO Node Pass - Project Overview

## Overview
This project is a Web3 NFT checkout and dashboard application for selling TUDAO Node Licenses. It supports cryptocurrency (USDC on Base) and wire transfer payments for three tiers (Verifier, Professional, Founder). Upon purchase, an NFT is minted to the user's wallet via Thirdweb, and the transaction is recorded in a PostgreSQL database. The application also includes an owner dashboard for license management and operator setup preferences.

## User Preferences
I prefer iterative development, with clear communication at each step. Please provide detailed explanations for any significant architectural decisions or complex code implementations. Ask before making major changes to the existing structure or introducing new dependencies. Ensure that all new features are accompanied by relevant tests. I appreciate a direct and efficient communication style.

## System Architecture

### UI/UX Decisions
The application uses React 18 with TypeScript, Tailwind CSS, and Shadcn UI for a responsive, modern design. It employs a blue primary color scheme, professional grays, semantic status colors, and Inter/Space Grotesk typography. A mobile-first approach is implemented with custom TUDAO badge designs.

### Technical Implementations
- **Payment Methods**: Supports Crypto (USDC on Base) via Thirdweb ConnectButton, Square card payments, and Wire Transfer (manual activation). Stripe backend integration exists but is not exposed in the UI.
- **NFT Minting**: Server-side NFT minting occurs via Thirdweb SDK upon successful payment or manual wire transfer activation.
- **Database**: PostgreSQL with Drizzle ORM stores purchase and license information, replacing a previous Supabase integration.
- **Environment Configuration**: Behavior is controlled by environment variables for network switching, feature flags, and API keys.
- **Test Mode**: Set `TEST_MODE=true` environment variable to switch to Base Sepolia testnet contracts and Square Sandbox for testing without real money. See TESTING.md for complete guide.
- **Cap Enforcement**: Founding Node 300-cap is enforced through multiple validation layers using PostgreSQL advisory locks.
- **Feature Specifications**:
    - **Landing Page**: Marketing homepage at `/` with project overview, benefits, tier comparison, FAQ, and payment methods.
    - **Checkout Page**: Allows tier selection, review, wallet connection, and payment method choice.
    - **Success Page**: Displays post-purchase confirmation, license details, and access to the dashboard.
    - **Dashboard**: Enables license management, displays purchase metadata, and allows operator setup preferences.
    - **Test Mode Detection**: Automatically enabled on Base Sepolia with specific UI adjustments.
    - **Tier Configuration**: Defines pricing and caps for Verifier, Professional, and Founder tiers.
    - **Admin Dashboard**: A comprehensive admin panel at `/admin` for statistics, managing pending wire transfers, and viewing all licenses. (Note: Lacks authentication).
    - **Founding Team Minting**: Admin interface for minting free Founder-level NFTs to bootstrap the network. 5 founding members (Architect: 1, Regent: 1, Councilor: 1, Guardian: 1, Oracle: 1) will collectively operate 61 nodes (Architect operates 1 node, each other role operates 15 nodes). Each role has custom badge artwork. Accessed via `/admin` with allocation tracking and wallet validation.

### System Design Choices
The system is designed for scalability and maintainability, using a modern React frontend and a robust PostgreSQL backend. The use of environment variables provides flexible configuration. Cap enforcement mechanisms ensure business logic integrity.

## External Dependencies

- **Thirdweb**: Web3 wallet connection and server-side NFT minting.
- **Stripe**: (Backend only) Credit card and ACH processing.
- **PostgreSQL**: Primary database for buyer and license information.
- **Drizzle ORM**: For database interaction.
- **Express.js**: Backend server framework.
- **React 18**: Frontend JavaScript library.
- **Tailwind CSS**: Styling framework.
- **Shadcn UI**: UI component library.
- **TanStack Query**: Frontend server state management.
- **Wouter**: React routing library.
- **React Hook Form & Zod**: Form management and validation.
- **Neon**: PostgreSQL database hosting (via `@neondatabase/serverless`).
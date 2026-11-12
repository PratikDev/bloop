import { ClientRouter } from "@/router/ClientRouter";

// The static export writes this page as 404.html, which the host serves for any unknown address.
// The app's router then shows its own "no signal" page (pages/NotFound) inside the normal shell,
// instead of Next's default white 404.
export default function NotFound() {
  return <ClientRouter />;
}

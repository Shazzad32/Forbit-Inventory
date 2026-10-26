import LoginForm from "@/components/LoginForm";
import Icon from "@/components/Icon";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="pin" />
          </span>
          <span>
            <b>Inventory</b>
            <small>Device management</small>
          </span>
        </div>
        <div>
          <h2>Every device, accounted for.</h2>
          <p>Store, retail, Rangs and returns in one place, with a clear record of who holds what.</p>
        </div>
      </aside>
      <main className="auth-main">
        <LoginForm />
      </main>
    </div>
  );
}

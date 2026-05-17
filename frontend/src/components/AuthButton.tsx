import {useState, useEffect} from "react";
import {supabase} from "../lib/supabase";

export function AuthButton() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({data}) => {
            setUser(data.session?.user ?? null);
        });
        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const login = () =>
        supabase.auth.signInWithOAuth({
            provider: "google",
            options: {redirectTo: window.location.origin},
        });

    const logout = () => supabase.auth.signOut();

    if (user)
        return (
            <button className="auth-btn" onClick={logout} title={user.email}>
                {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} className="auth-avatar" />
                ) : (
                    "👤"
                )}{" "}
                logout
            </button>
        );

    return (
        <button className="auth-btn" onClick={login}>
            🔑 login
        </button>
    );
}

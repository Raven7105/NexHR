import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import nLogo from "../assets/n_logo.svg";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch {
            setError("Email ou mot de passe incorrect.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-3xl animate-blob" />
            <div className="absolute bottom-[-15%] right-[10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-3xl animate-blob animation-delay-4000" />

            <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-8 lg:px-16 pt-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-16 xl:gap-24 items-start">
                <div className="hidden lg:flex lg:flex-col lg:items-start lg:justify-start lg:pr-12 lg:pl-2">
                    <div className="relative mb-8 inline-flex items-start justify-start">
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-3xl" />
                        <img
                            src={nLogo}
                            alt="Logo NexHR"
                            className="relative h-28 w-28 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                        />
                    </div>

                    <h1 className="font-serif text-4xl xl:text-5xl font-medium text-white leading-[1.12] mb-8 tracking-[-0.02em] max-w-3xl">
                        GEREZ VOS EQUIPES ET VOS PROCESSUS RH EN TOUTE SIMPLICITE, OU QUE VOUS SOYEZ.
                    </h1>
                    <p className="font-serif text-xl xl:text-[1.3rem] font-medium text-slate-200 leading-[1.35] mb-6 tracking-[0.01em] max-w-2xl">
                        Présences, congés, paie et tableau de bord décisionnel : tous vos outils RH réunis sur une seule plateforme.
                    </p>
                </div>

                <div className="relative bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md mx-auto lg:ml-auto lg:mr-0 overflow-hidden">
                    <div
                        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-60 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(255,255,255,0) 70%)",
                        }}
                    />

                    <div className="lg:hidden flex items-center gap-3 mb-8 relative z-10">
                        <div className="relative flex h-14 w-14 items-center justify-center">
                            <img
                                src={nLogo}
                                alt="Logo NexHR"
                                className="relative h-12 w-12 object-contain"
                            />
                        </div>
                        <span className="text-slate-900 font-bold text-lg">NexHR</span>
                    </div>

                    <h2 className="relative z-10 text-2xl font-extrabold uppercase text-slate-900 leading-tight mb-8">
                        Connectez-vous à votre compte NexHR
                    </h2>

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-800 mb-1.5 ">
                                Adresse email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Entrez votre adresse email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-800 mb-1.5">
                                Mot de passe <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Entrez votre mot de passe"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 transition-colors"
                        >
                            {isSubmitting ? "Connexion..." : "Se connecter"}
                        </button>

                        <button
                            type="button"
                            className="w-full border border-slate-300 text-slate-700 font-medium rounded-lg py-2.5 hover:bg-slate-50 transition-colors"
                        >
                            Mot de passe oublié ?
                        </button>
                    </form>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-8 lg:px-16 py-10 flex items-center justify-between">
                <p className="text-slate-400 text-sm">
                    A new <span className="text-blue-400 font-medium">energy</span> for human ressources
                </p>
                <p className="text-slate-500 font-bold tracking-wide text-sm">NEXHR</p>
            </div>
        </div>
    );
}
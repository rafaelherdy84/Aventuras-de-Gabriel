import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'prominent' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'prominent',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install-app"
        type="button"
        onClick={install}
        className={`flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-950/40 hover:brightness-110 active:scale-98 transition cursor-pointer border border-sky-400/30 ${className}`}
      >
        <Download className="w-4 h-4 text-white" />
        <span>Instalar no Celular</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit beforeinstallprompt is not supported)
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 hover:brightness-110 active:scale-98 transition cursor-pointer border border-indigo-400/30 ${className}`}
        >
          <Download className="w-4 h-4 text-purple-200" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Instalar no iPhone / iPad</h3>
                  <p className="text-xs text-slate-400">Jogue em tela cheia sem barra do Safari</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Toque no botão <strong className="text-white">Compartilhar</strong>{' '}
                    <Share2 className="w-4 h-4 inline text-sky-400" /> na barra inferior do Safari.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Role a lista para baixo e toque em{' '}
                    <strong className="text-white">Adicionar à Tela de Início</strong>{' '}
                    <PlusSquare className="w-4 h-4 inline text-sky-400" />.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Toque em <strong className="text-emerald-400">Adicionar</strong> no canto superior direito.
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Pronto! O ícone do jogo aparecerá na sua tela inicial e funcionará sem nenhuma barra do navegador!
              </p>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-bold text-white transition cursor-pointer"
              >
                Entendi!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop or non-detected browser: provide prompt to add to bookmarks/home screen
  return (
    <button
      id="btn-pwa-install-generic"
      type="button"
      onClick={() => setShowIOSGuide(true)}
      className={`flex items-center justify-center gap-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 border border-slate-700 transition cursor-pointer ${className}`}
    >
      <Download className="w-4 h-4 text-amber-300" />
      <span>Instalar no Aparelho</span>
    </button>
  );
};

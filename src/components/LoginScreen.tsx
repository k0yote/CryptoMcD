import { useState, useEffect } from 'react';
import { Fingerprint, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import {
  isPasskeySupported,
  isPasskeyAvailable,
  hasRegisteredPasskey,
  registerPasskey,
  authenticateWithPasskey,
} from '@/lib/passkey';

interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(true);

  useEffect(() => {
    setHasPasskey(hasRegisteredPasskey());
    isPasskeyAvailable().then(setPasskeyAvailable);
  }, []);

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    if (!isPasskeySupported()) {
      setMessage({
        type: 'error',
        text: 'お使いのブラウザはパスキーをサポートしていません',
      });
      setIsLoading(false);
      return;
    }

    const result = await authenticateWithPasskey();

    if (result.success) {
      setMessage({
        type: 'success',
        text: `${result.username}さん、ログインしました！`,
      });
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      setMessage({
        type: 'error',
        text: result.error || '認証に失敗しました',
      });
    }

    setIsLoading(false);
  };

  const handlePasskeyRegister = async () => {
    if (!username.trim()) {
      setMessage({
        type: 'error',
        text: 'ユーザー名を入力してください',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await registerPasskey(username.trim());

    if (result.success) {
      setMessage({
        type: 'success',
        text: 'パスキーを登録しました！',
      });
      setHasPasskey(true);
      setTimeout(() => {
        setMode('login');
        setMessage(null);
      }, 1500);
    } else {
      setMessage({
        type: 'error',
        text: result.error || '登録に失敗しました',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          {mode === 'login' ? (
            <Fingerprint className="w-8 h-8 text-indigo-600" />
          ) : (
            <UserPlus className="w-8 h-8 text-indigo-600" />
          )}
        </div>
        <h2 className="mb-2 text-gray-900">
          {mode === 'login' ? 'パスキーでログイン' : 'パスキーを登録'}
        </h2>
        <p className="text-gray-600">
          {mode === 'login'
            ? '生体認証またはセキュリティキーを使用'
            : '新しいパスキーを作成します'}
        </p>
      </div>

      {/* Platform authenticator not available warning */}
      {!passkeyAvailable && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 text-yellow-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>このデバイスでは生体認証が利用できません。外部セキュリティキーをお使いください。</span>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {mode === 'login' ? (
        <>
          {/* Passkey Login */}
          <div className="mb-6">
            <button
              onClick={handlePasskeyLogin}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Fingerprint className="w-6 h-6" />
              {isLoading ? '認証中...' : 'パスキーでログイン'}
            </button>
          </div>

          {/* Register link */}
          <div className="text-center">
            <button
              onClick={() => {
                setMode('register');
                setMessage(null);
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              パスキーをお持ちでない方はこちら
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Username input */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="お名前を入力"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Register button */}
          <div className="mb-6">
            <button
              onClick={handlePasskeyRegister}
              disabled={isLoading || !username.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-6 h-6" />
              {isLoading ? '登録中...' : 'パスキーを登録'}
            </button>
          </div>

          {/* Login link */}
          <div className="text-center">
            <button
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              すでにパスキーをお持ちの方はこちら
            </button>
          </div>
        </>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          {mode === 'login'
            ? '指紋認証、顔認証、またはセキュリティキーを使って、パスワードなしで安全にログインできます。'
            : 'パスキーを登録すると、次回から生体認証で簡単にログインできます。'}
        </p>
      </div>
    </div>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PaymentCancel: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isJapanese = i18n.language === 'ja';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {isJapanese ? '支払いがキャンセルされました' : 'Payment Cancelled'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isJapanese 
            ? '支払いがキャンセルされました。プラットフォームへのアクセスには、サブスクリプションを完了する必要があります。'
            : 'Your payment was cancelled. To access the platform, you need to complete your subscription.'}
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
          <p className="text-sm text-amber-800">
            {isJapanese 
              ? '注意: サロンアカウントは支払い完了後にのみ有効化されます。'
              : 'Note: Salon accounts are only activated after payment completion.'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/signup/salon')}
            className="w-full px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)'
            }}
          >
            {isJapanese ? '支払いをやり直す' : 'Try Payment Again'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {isJapanese ? 'ログインページに戻る' : 'Back to Login'}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          {isJapanese 
            ? 'お困りの場合は、サポートまでお問い合わせください。'
            : 'If you need help, please contact our support team.'}
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import paymentService from '../services/payment.service';
import { showToast } from '../utils/toast';

export const PaymentSuccess: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  const sessionId = searchParams.get('session_id');
  const isJapanese = i18n.language === 'ja';

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    if (!sessionId) {
      showToast.error('Invalid payment session');
      navigate('/login');
      return;
    }

    try {
      const result = await paymentService.verifySession(sessionId);
      
      if (result.data.paymentStatus === 'paid') {
        setVerified(true);
        
        // Show toast only once
        if (!hasShownToast) {
          showToast.success('Payment completed successfully! Please login to continue.');
          setHasShownToast(true);
        }
        
        // Get email from session result
        const email = result.data.customerEmail;
        
        if (!email) {
          console.error('No email in session result');
          showToast.error('Session verification succeeded but email not found. Please login.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Payment complete - redirect directly to login (email already verified)
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email,
              message: 'Payment completed successfully! Please login to continue.',
              fromPayment: true
            } 
          });
        }, 2000);
      } else {
        showToast.error('Payment verification failed');
        navigate('/payment/cancel');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      showToast.error('Failed to verify payment');
      navigate('/payment/cancel');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {verifying ? (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {isJapanese ? '支払いを確認中...' : 'Verifying Payment...'}
            </h1>
            <p className="text-gray-600">
              {isJapanese 
                ? 'お支払い状況を確認しています。しばらくお待ちください。'
                : 'Please wait while we verify your payment.'}
            </p>
          </>
        ) : verified ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {isJapanese ? '支払い完了！' : 'Payment Successful!'}
            </h1>
            <p className="text-gray-600 mb-6">
              {isJapanese 
                ? 'サブスクリプションが有効化されました。次のステップに進んでください。'
                : 'Your subscription has been activated. Proceed to the next step.'}
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-semibold mb-2">
                {isJapanese ? '次のステップ：' : 'Next Step:'}
              </p>
              <p className="text-sm text-blue-700">
                {isJapanese 
                  ? 'ログインしてオンボーディングを完了してください。'
                  : 'Login to complete your profile setup and start using the platform.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {isJapanese ? 'リダイレクト中...' : 'Redirecting...'}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentSuccess;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Check, Clock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import paymentService from '../services/payment.service';
import { showToast } from '../utils/toast';

export const PaymentCheckout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  // Get salon data from location state (passed from signup)
  const { salonId, email } = location.state || {};

  useEffect(() => {
    if (!salonId || !email) {
      showToast.error('Payment session expired. Please sign up again.');
      navigate('/signup/salon');
    }
  }, [salonId, email, navigate]);

  const plans = {
    monthly: {
      price: 29,
      period: 'month',
      savings: null,
      features: [
        'Access to influencer discovery',
        'Unlimited connection requests',
        'Real-time chat messaging',
        'Social media integration',
        'Analytics dashboard',
        'Email support',
      ],
    },
    yearly: {
      price: 290,
      period: 'year',
      savings: 17,
      features: [
        'All monthly features',
        'Priority support',
        'Advanced analytics',
        'Early access to new features',
        'Dedicated account manager',
        'Save 17% compared to monthly',
      ],
    },
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const result = await paymentService.createCheckoutSession({
        salonId,
        email,
        plan: selectedPlan,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to initiate checkout';
      showToast.error(errorMessage);
      
      // If email not verified, redirect to verification
      if (errorMessage.includes('Email must be verified')) {
        setTimeout(() => {
          navigate('/verify-otp', { state: { email } });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans[selectedPlan];
  const isJapanese = i18n.language === 'ja';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {isJapanese ? 'サブスクリプションプランを選択' : 'Choose Your Subscription Plan'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isJapanese 
              ? 'インフルエンサーマーケティングプラットフォームへのアクセスを取得'
              : 'Get access to our influencer marketing platform and start connecting with creators'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`relative cursor-pointer rounded-2xl p-8 border-2 transition-all duration-300 ${
                selectedPlan === 'monthly'
                  ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-white shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-pink-200 hover:shadow-lg'
              }`}
            >
              {selectedPlan === 'monthly' && (
                <div className="absolute top-4 right-4">
                  <div className="bg-pink-500 text-white rounded-full p-1">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isJapanese ? '月間プラン' : 'Monthly Plan'}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600">/{isJapanese ? '月' : 'month'}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-6">
                {plans.monthly.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yearly Plan */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              className={`relative cursor-pointer rounded-2xl p-8 border-2 transition-all duration-300 ${
                selectedPlan === 'yearly'
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-white shadow-xl scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-lg'
              }`}
            >
              {selectedPlan === 'yearly' && (
                <div className="absolute top-4 right-4">
                  <div className="bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              )}

              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {isJapanese ? '17% OFF' : 'Save 17%'}
              </div>

              <div className="mb-6 mt-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isJapanese ? '年間プラン' : 'Yearly Plan'}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">$290</span>
                  <span className="text-gray-600">/{isJapanese ? '年' : 'year'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  ${(290 / 12).toFixed(2)}/{isJapanese ? '月相当' : 'month equivalent'}
                </p>
              </div>

              <ul className="space-y-4 mb-6">
                {plans.yearly.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200 shadow-md">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Shield className="w-10 h-10 text-green-500 mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  {isJapanese ? '安全な支払い' : 'Secure Payment'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isJapanese ? 'Stripe による暗号化' : 'Encrypted by Stripe'}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <Clock className="w-10 h-10 text-blue-500 mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  {isJapanese ? 'いつでもキャンセル' : 'Cancel Anytime'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isJapanese ? 'キャンセル料なし' : 'No cancellation fees'}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <CreditCard className="w-10 h-10 text-purple-500 mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  {isJapanese ? '即時アクセス' : 'Instant Access'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isJapanese ? '支払い後すぐに使用可能' : 'Start using immediately'}
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="text-center">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="px-10 py-4 rounded-xl text-white text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading 
                  ? 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)' 
                  : 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <div className="flex items-center gap-3 justify-center">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{isJapanese ? '処理中...' : 'Processing...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center">
                  <CreditCard className="w-6 h-6" />
                  <span>
                    {isJapanese 
                      ? `${currentPlan.price}ドル/${currentPlan.period === 'month' ? '月' : '年'} で続行`
                      : `Continue with $${currentPlan.price}/${currentPlan.period}`}
                  </span>
                </div>
              )}
            </button>

            <p className="text-sm text-gray-500 mt-4">
              {isJapanese 
                ? 'Stripeの安全な決済ページにリダイレクトされます'
                : "You'll be redirected to Stripe's secure payment page"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;

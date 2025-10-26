import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          {t('legal.privacy.title')}
        </h1>
        <p className="text-gray-600 mb-8">{t('legal.lastUpdated')} {t('legal.lastUpdatedDate')}</p>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-pink-600 hover:text-fuchsia-600 hover:underline"
          >
            ← {t('common.back')}
          </button>
        </div>

        <div className="space-y-8 bg-white shadow-sm rounded-2xl border border-gray-200 p-6 sm:p-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('legal.privacy.sections.dataWeCollect.title')}</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('legal.privacy.sections.dataWeCollect.items.0')}</li>
              <li>{t('legal.privacy.sections.dataWeCollect.items.1')}</li>
              <li>{t('legal.privacy.sections.dataWeCollect.items.2')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('legal.privacy.sections.useOfData.title')}</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('legal.privacy.sections.useOfData.items.0')}</li>
              <li>{t('legal.privacy.sections.useOfData.items.1')}</li>
              <li>{t('legal.privacy.sections.useOfData.items.2')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('legal.privacy.sections.rights.title')}</h2>
            <p className="text-gray-700 leading-relaxed">{t('legal.privacy.sections.rights.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('legal.privacy.sections.changes.title')}</h2>
            <p className="text-gray-700 leading-relaxed">{t('legal.privacy.sections.changes.body')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

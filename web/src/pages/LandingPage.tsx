import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaUserCheck, FaChartPie, FaUsers, FaChartLine, FaRocket, FaComments, FaSearch, FaStar, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import Navbar from "../components/Navbar";

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: <FaUsers className="text-3xl sm:text-4xl" />,
      title: t('landing.features.discover.title'),
      description: t('landing.features.discover.description'),
      gradient: "from-pink-400 via-rose-400 to-fuchsia-400"
    },
    {
      icon: <FaChartLine className="text-3xl sm:text-4xl" />,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      gradient: "from-fuchsia-400 via-purple-400 to-indigo-400"
    },
    {
      icon: <FaRocket className="text-3xl sm:text-4xl" />,
      title: t('landing.features.campaign.title'),
      description: t('landing.features.campaign.description'),
      gradient: "from-rose-400 via-pink-400 to-fuchsia-400"
    },
    {
      icon: <FaComments className="text-3xl sm:text-4xl" />,
      title: t('landing.features.messaging.title'),
      description: t('landing.features.messaging.description'),
      gradient: "from-violet-400 via-fuchsia-400 to-pink-400"
    },
  ];

  const stats = [
    { number: "50K+", label: t('landing.stats.influencers') },
    { number: "10K+", label: t('landing.stats.brands') },
    { number: "1M+", label: t('landing.stats.campaigns') },
    { number: "98%", label: t('landing.stats.successRate') },
  ];

  const keyPillars = [
    { icon: <FaUserCheck />, name: t('landing.pillars.authenticReach'), color: "from-pink-500 via-rose-500 to-fuchsia-500" },
    { icon: <FaChartPie />, name: t('landing.pillars.dataResults'), color: "from-fuchsia-500 via-purple-500 to-indigo-500" },
  ];

  const benefits = [
    t('landing.benefits.tracking'),
    t('landing.benefits.insights'),
    t('landing.benefits.metrics'),
    t('landing.benefits.verified'),
    t('landing.benefits.tools'),
    t('landing.benefits.support')
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 overflow-hidden">
      <Navbar />
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div
          className="absolute w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-[80px] sm:blur-[150px]"
          animate={{
            x: mousePosition.x / 80,
            y: mousePosition.y / 80,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 30 }}
          style={{ top: "20%", left: "10%" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-gradient-to-br from-fuchsia-300 to-purple-300 rounded-full blur-[60px] sm:blur-[120px]"
          animate={{
            x: -mousePosition.x / 60,
            y: -mousePosition.y / 60,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 30 }}
          style={{ bottom: "20%", right: "10%" }}
        />
      </div>

      {/* Hero Section */}
      <motion.header 
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="inline-block mb-6 sm:mb-8 px-4 sm:px-6 py-2 bg-white/80 backdrop-blur-md rounded-full border border-pink-200/50 shadow-lg shadow-pink-200/50"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 font-bold text-xs sm:text-sm">{t('landing.tagline')}</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 sm:mb-8 px-2">
              <span className="text-gray-800">{t('landing.hero.title')}</span>
              <span className="block bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent mt-2">
                {t('landing.hero.subtitle')}
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
              {t('landing.hero.description')}
            </p>

            <motion.div 
              className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/signup')}
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-sm sm:text-base">{t('landing.hero.ctaInfluencer')}</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-150" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/signup')}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/90 backdrop-blur-md text-gray-800 rounded-xl font-bold border-2 border-pink-300 hover:border-pink-400 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              >
                {t('landing.hero.ctaSalon')}
              </motion.button>
            </motion.div>

            {/* Platform Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
            >
              {keyPillars.map((pillar, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3, scale: 1.03 }}
                  transition={{ duration: 0.15 }}
                  className={`bg-gradient-to-r ${pillar.color} px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white font-medium flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base`}
                >
                  <span className="text-xl sm:text-2xl">{pillar.icon}</span>
                  {pillar.name}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="bg-white/80 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl text-center border border-pink-100/50 shadow-xl hover:shadow-2xl transition-all duration-200"
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-gray-800 px-4">
              {t('landing.features.subtitleAlt').split('\n')[0]}
              <span className="block bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent mt-2">
                {t('landing.features.subtitleAlt').split('のための')[1] || t('landing.features.subtitle')}
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto px-4">
              {t('landing.features.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-pink-100/50 hover:shadow-2xl transition-all duration-200"
              >
                <div className={`inline-block p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2 sm:mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-pink-100/30 via-rose-100/30 to-fuchsia-100/30 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-center mb-12 sm:mb-16 lg:mb-20 text-gray-800 px-4"
          >
            {t('landing.howItWorks.title')}
          </motion.h2>

          <div className="space-y-8 sm:space-y-12 lg:space-y-16">
            {[
              {
                step: "01",
                title: t('landing.howItWorks.step1.title'),
                desc: t('landing.howItWorks.step1.description'),
                icon: <FaUsers />
              },
              {
                step: "02",
                title: t('landing.howItWorks.step2.title'),
                desc: t('landing.howItWorks.step2.description'),
                icon: <FaSearch />
              },
              {
                step: "03",
                title: t('landing.howItWorks.step3.title'),
                desc: t('landing.howItWorks.step3.description'),
                icon: <FaChartLine />
              },
              {
                step: "04",
                title: t('landing.features.messaging.title'),
                desc: t('landing.features.messaging.description'),
                icon: <FaRocket />
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 lg:gap-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.15 }}
                  className="flex-none w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 text-white rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <span className="text-2xl sm:text-3xl">{item.icon}</span>
                </motion.div>
                <div className="flex-1 bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-pink-100/50 shadow-lg">
                  <div className="text-pink-600 font-bold text-xs sm:text-sm mb-2">STEP {item.step}</div>
                  <h4 className="text-xl sm:text-2xl font-black mb-2 sm:mb-3 text-gray-800">{item.title}</h4>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-gray-800">
                {t('landing.whyChoose.title')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8">
                {t('landing.whyChoose.subtitle')}
              </p>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <FaCheckCircle className="text-xl sm:text-2xl text-pink-600 flex-none" />
                    <span className="text-sm sm:text-base lg:text-lg text-gray-700 font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-2xl">
                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <FaStar className="text-3xl sm:text-4xl text-yellow-300" />
                    <div>
                      <div className="text-white font-black text-xl sm:text-2xl">4.9/5</div>
                      <div className="text-white/90 text-sm sm:text-base">{t('landing.whyChoose.rating')}</div>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-4 sm:pt-6">
                    <p className="text-white/95 italic text-sm sm:text-base leading-relaxed">
                      "{t('landing.whyChoose.testimonial')}"
                    </p>
                    <div className="text-white/80 mt-3 sm:mt-4 text-xs sm:text-sm">— {t('landing.whyChoose.testimonialAuthor')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-pink-600 via-rose-600 to-fuchsia-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 px-4">
                {t('landing.cta.titleAlt')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
                {t('landing.cta.descriptionAlt')}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => navigate('/signup')}
                  className="px-8 sm:px-10 py-3.5 sm:py-5 bg-white text-pink-600 rounded-xl font-black shadow-xl hover:shadow-2xl transition-all text-sm sm:text-base"
                >
                  {t('landing.cta.buttonInfluencer')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => navigate('/signup')}
                  className="px-8 sm:px-10 py-3.5 sm:py-5 bg-white/10 backdrop-blur-lg text-white border-2 border-white rounded-xl font-bold hover:bg-white/20 transition-all text-sm sm:text-base"
                >
                  {t('landing.cta.buttonSalon')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-xl text-gray-600 py-12 sm:py-16 relative z-10 border-t border-pink-100/50">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                {t('brand.name')}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('landing.footer.tagline')}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('landing.footer.platform')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.footer.forInfluencers')}</a></li>
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.footer.forBrands')}</a></li>
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.features.analytics.title')}</a></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.footer.aboutUs')}</a></li>
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.footer.careers')}</a></li>
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('common.sendMessage')}</a></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-gray-800 font-bold text-base sm:text-lg mb-3 sm:mb-4">{t('landing.footer.support')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.footer.helpCenter')}</a></li>
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">{t('landing.footer.privacyPolicy')}</a></li>
                <li><a href="#" className="text-sm sm:text-base hover:text-pink-600 transition-colors duration-150">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-pink-100/50 pt-6 sm:pt-8 text-center text-gray-600">
            <p className="text-xs sm:text-sm font-medium">© {new Date().getFullYear()} {t('brand.name')}. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
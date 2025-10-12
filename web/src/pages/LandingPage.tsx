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
      icon: <FaUsers className="text-4xl" />,
      title: t('landing.features.discover.title'),
      description: t('landing.features.discover.description'),
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      gradient: "from-sky-400 to-blue-500"
    },
    {
      icon: <FaRocket className="text-4xl" />,
      title: t('landing.features.campaign.title'),
      description: t('landing.features.campaign.description'),
      gradient: "from-rose-400 to-pink-500"
    },
    {
      icon: <FaComments className="text-4xl" />,
      title: t('landing.features.messaging.title'),
      description: t('landing.features.messaging.description'),
      gradient: "from-amber-400 to-orange-500"
    },
  ];

  const stats = [
    { number: "50K+", label: t('landing.stats.influencers') },
    { number: "10K+", label: t('landing.stats.brands') },
    { number: "1M+", label: t('landing.stats.campaigns') },
    { number: "98%", label: t('landing.stats.successRate') },
  ];

  const keyPillars = [
    { icon: <FaUserCheck />, name: t('landing.pillars.authenticReach'), color: "from-emerald-400 to-teal-500" },
    { icon: <FaChartPie />, name: t('landing.pillars.dataResults'), color: "from-sky-400 to-blue-500" },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-white overflow-hidden">
      <Navbar />
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div
          className="absolute w-[600px] h-[600px] bg-emerald-400 rounded-full blur-[150px]"
          animate={{
            x: mousePosition.x / 80,
            y: mousePosition.y / 80,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 30 }}
          style={{ top: "20%", left: "10%" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] bg-teal-400 rounded-full blur-[120px]"
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
        className="relative min-h-screen flex items-center justify-center px-6 py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="inline-block mb-8 px-6 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-400/30"
            >
              <span className="text-emerald-200 font-medium text-sm">{t('landing.tagline')}</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              {t('landing.hero.title')}
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                {t('landing.hero.subtitle')}
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              {t('landing.hero.description')}
            </p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(52, 211, 153, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signup')}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                {t('landing.hero.ctaInfluencer')}
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                {t('landing.hero.ctaSalon')}
              </motion.button>
            </motion.div>

            {/* Platform Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="flex justify-center gap-4"
            >
              {keyPillars.map((pillar, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3 }}
                  className={`bg-gradient-to-r ${pillar.color} px-6 py-3 rounded-full text-white font-medium flex items-center gap-2 shadow-lg`}
                >
                  <span className="text-2xl">{pillar.icon}</span>
                  {pillar.name}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      {/* Stats Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md p-8 rounded-2xl text-center border border-white/10"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-400 mt-2 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative z-10">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              {t('landing.features.subtitleAlt').split('\n')[0]}
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mt-2">
                {t('landing.features.subtitleAlt').split('のための')[1] || t('landing.features.subtitle')}
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t('landing.features.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.7 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className={`inline-block p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-black/20 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-bold text-center mb-20"
          >
            {t('landing.howItWorks.title')}
          </motion.h2>

          <div className="space-y-16">
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
                initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.8 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex-none w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <span className="text-3xl">{item.icon}</span>
                </motion.div>
                <div className="flex-1 bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                  <div className="text-emerald-400 font-bold text-sm mb-2">STEP {item.step}</div>
                  <h4 className="text-2xl font-bold mb-3">{item.title}</h4>
                  <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-32 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                {t('landing.whyChoose.title')}
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                {t('landing.whyChoose.subtitle')}
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4"
                  >
                    <FaCheckCircle className="text-2xl text-emerald-400 flex-none" />
                    <span className="text-lg text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-12 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <FaStar className="text-4xl text-yellow-300" />
                    <div>
                      <div className="text-white font-bold text-2xl">4.9/5</div>
                      <div className="text-white/70">{t('landing.whyChoose.rating')}</div>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-6">
                    <p className="text-white/90 italic">
                      "{t('landing.whyChoose.testimonial')}"
                    </p>
                    <div className="text-white/70 mt-4">— {t('landing.whyChoose.testimonialAuthor')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                {t('landing.cta.titleAlt')}
              </h2>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                {t('landing.cta.descriptionAlt')}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/signup')}
                  className="px-10 py-5 bg-white text-emerald-600 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all"
                >
                  {t('landing.cta.buttonInfluencer')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/signup')}
                  className="px-10 py-5 bg-white/10 backdrop-blur-lg text-white border-2 border-white rounded-xl font-bold hover:bg-white/20 transition-all"
                >
                  {t('landing.cta.buttonSalon')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md text-gray-300 py-16 relative z-10 border-t border-white/10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">{t('brand.name')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('landing.footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.platform')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.forInfluencers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.forBrands')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.features.analytics.title')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.aboutUs')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.careers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('common.sendMessage')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.support')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.privacyPolicy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} {t('brand.name')}. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
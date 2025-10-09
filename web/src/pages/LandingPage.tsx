import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaUserCheck, FaChartPie, FaUsers, FaChartLine, FaRocket, FaComments, FaSearch, FaStar, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import Navbar from "../components/Navbar";

const LandingPage = () => {
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
      title: "Discover Influencers",
      description: "Search and filter nano and micro-influencers by niche, region, follower count, and engagement metrics.",
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: "Performance Analytics",
      description: "Track follower growth, engagement rates, likes, comments, and shares with comprehensive analytics dashboard.",
      gradient: "from-sky-400 to-blue-500"
    },
    {
      icon: <FaRocket className="text-4xl" />,
      title: "Campaign Management",
      description: "Launch, monitor, and optimize influencer campaigns with real-time performance tracking and reporting.",
      gradient: "from-rose-400 to-pink-500"
    },
    {
      icon: <FaComments className="text-4xl" />,
      title: "Direct Messaging",
      description: "Communicate seamlessly with influencers through our integrated messaging system without leaving the platform.",
      gradient: "from-amber-400 to-orange-500"
    },
  ];

  const stats = [
    { number: "50K+", label: "Active Influencers" },
    { number: "10K+", label: "Brand Partners" },
    { number: "1M+", label: "Campaigns" },
    { number: "98%", label: "Success Rate" },
  ];

  const keyPillars = [
    { icon: <FaUserCheck />, name: "Authentic Reach", color: "from-emerald-400 to-teal-500" },
    { icon: <FaChartPie />, name: "Data-Driven Results", color: "from-sky-400 to-blue-500" },
  ];

  const benefits = [
    "Real-time engagement tracking",
    "Comprehensive audience insights",
    "Campaign performance metrics",
    "Verified influencer profiles",
    "Secure collaboration tools",
    "24/7 dedicated support"
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
              <span className="text-emerald-200 font-medium text-sm">Powering Nano & Micro Influencer Marketing</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              Connect With
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                Authentic Influencers
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              The ultimate platform for discovering, analyzing, and collaborating with nano and micro-influencers on Instagram and TikTok.
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
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
              >
                Sign Up as Influencer
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                Sign Up as Brand
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
              Powerful Features for
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mt-2">
                Seamless Collaboration
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage influencer relationships and campaigns
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
            How It Works
          </motion.h2>

          <div className="space-y-16">
            {[
              {
                step: "01",
                title: "Register & Connect",
                desc: "Influencers create profiles and connect their Instagram and TikTok accounts for verification.",
                icon: <FaUsers />
              },
              {
                step: "02",
                title: "Data Collection",
                desc: "System automatically collects public metrics including followers, engagement, and post performance.",
                icon: <FaSearch />
              },
              {
                step: "03",
                title: "Performance Scoring",
                desc: "Platform calculates engagement scores based on collected data to help brands make informed decisions.",
                icon: <FaChartLine />
              },
              {
                step: "04",
                title: "Connect & Collaborate",
                desc: "Brands discover influencers through advanced search and connect directly via integrated messaging.",
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
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Built specifically for nano and micro-influencer campaigns
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
                      <div className="text-white/70">Average Rating</div>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-6">
                    <p className="text-white/90 italic">
                      "This platform revolutionized how we connect with micro-influencers. The analytics and messaging tools are exceptional!"
                    </p>
                    <div className="text-white/70 mt-4">— Sarah M., Marketing Director</div>
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
                Ready to Transform Your Marketing?
              </h2>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                Join thousands of brands and influencers building authentic partnerships
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-white text-emerald-600 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all"
                >
                  Get Started as Influencer
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-white/10 backdrop-blur-lg text-white border-2 border-white rounded-xl font-bold hover:bg-white/20 transition-all"
                >
                  Get Started as Brand
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
              <h3 className="text-white font-bold text-xl mb-4">BeautifulEncer</h3>
              <p className="text-gray-400 leading-relaxed">
                Empowering nano and micro-influencer marketing
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">For Influencers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Brands</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} BeautifulEncer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
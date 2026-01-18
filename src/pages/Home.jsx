import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Phone, Mail, ChevronDown, Sparkles, Award, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import MortgageCalculator from "@/components/mortgage/MortgageCalculator";
import MixCard from "@/components/mortgage/MixCard";
import MixComparison from "@/components/mortgage/MixComparison";
import TrackExplanation from "@/components/mortgage/TrackExplanation";
import { generateMixes } from "@/components/mortgage/MixGenerator";

export default function Home() {
    const [mixes, setMixes] = useState([]);
    const [selectedMix, setSelectedMix] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const handleCalculate = (formData) => {
        const generatedMixes = generateMixes(formData);
        setMixes(generatedMixes);
        setShowResults(true);
        
        // Scroll to results
        setTimeout(() => {
            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const scrollToCalculator = () => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50" dir="rtl">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="text-center">
                        {/* Logo */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-3 mb-8"
                        >
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-xl">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight">
                                מיקוד <span className="text-amber-400">משכנתאות</span>
                            </h1>
                        </motion.div>

                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight"
                        >
                            בנה את המשכנתא המושלמת
                            <br />
                            <span className="text-amber-400">בלי יועצים, בלי עמלות</span>
                        </motion.h2>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
                        >
                            המערכת החכמה שלנו בונה עבורך 3 תמהילי משכנתא מותאמים אישית, 
                            כך שתוכל לבחור את האפשרות הטובה ביותר ולחסוך עשרות אלפי שקלים
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap justify-center gap-4"
                        >
                            <Button 
                                size="lg"
                                onClick={scrollToCalculator}
                                className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 shadow-xl shadow-amber-500/25"
                            >
                                <Sparkles className="w-5 h-5 ml-2" />
                                התחל עכשיו - חינם
                            </Button>
                        </motion.div>

                        {/* Stats */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto"
                        >
                            {[
                                { icon: Users, value: "10,000+", label: "לקוחות מרוצים" },
                                { icon: Award, value: "₪150K", label: "חיסכון ממוצע" },
                                { icon: Clock, value: "3 דקות", label: "זמן בניית תמהיל" }
                            ].map((stat, idx) => (
                                <div key={idx} className="text-center">
                                    <stat.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                    <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
                                    <p className="text-sm text-blue-200">{stat.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 cursor-pointer"
                    onClick={scrollToCalculator}
                >
                    <ChevronDown className="w-8 h-8" />
                </motion.div>
            </section>

            {/* Calculator Section */}
            <section id="calculator" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        <MortgageCalculator onCalculate={handleCalculate} />
                        <TrackExplanation />
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <AnimatePresence>
                {showResults && (
                    <motion.section 
                        id="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white"
                    >
                        <div className="max-w-7xl mx-auto">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-12"
                            >
                                <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
                                    3 התמהילים שנבנו עבורך
                                </h2>
                                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                    בחר את התמהיל המתאים לך ביותר. כל תמהיל מותאם לפרופיל הסיכון שלך
                                </p>
                            </motion.div>

                            <div className="grid md:grid-cols-3 gap-6 mb-12">
                                {mixes.map((mix, idx) => (
                                    <MixCard 
                                        key={idx}
                                        mix={mix}
                                        index={idx}
                                        isSelected={selectedMix?.name === mix.name}
                                        onSelect={setSelectedMix}
                                    />
                                ))}
                            </div>

                            <MixComparison mixes={mixes} />
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">מיקוד משכנתאות</span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-slate-400">
                            <a href="tel:*1234" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                                <Phone className="w-4 h-4" />
                                *1234
                            </a>
                            <a href="mailto:info@mikud.co.il" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                                <Mail className="w-4 h-4" />
                                info@mikud.co.il
                            </a>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
                        <p>© 2024 מיקוד משכנתאות. כל הזכויות שמורות.</p>
                        <p className="mt-2">האתר מספק מידע כללי בלבד ואינו מהווה ייעוץ פיננסי מקצועי.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
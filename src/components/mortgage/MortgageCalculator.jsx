import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calculator, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function MortgageCalculator({ onCalculate }) {
    const [formData, setFormData] = useState({
        propertyValue: 2000000,
        loanAmount: 1500000,
        loanPeriod: 25,
        monthlyIncome: 25000
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCalculate(formData);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            maximumFractionDigits: 0
        }).format(value);
    };

    const ltv = ((formData.loanAmount / formData.propertyValue) * 100).toFixed(0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-amber-50/30 pointer-events-none" />
                <CardHeader className="relative pb-2">
                    <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                        מחשבון משכנתא
                    </CardTitle>
                    <p className="text-slate-500 mt-1">הזינו את פרטי ההלוואה ונבנה עבורכם 3 תמהילים מותאמים אישית</p>
                </CardHeader>
                <CardContent className="relative space-y-8 pt-4">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Property Value */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-medium text-slate-700">שווי הנכס</Label>
                                <span className="text-xl font-bold text-blue-600">{formatCurrency(formData.propertyValue)}</span>
                            </div>
                            <Slider
                                value={[formData.propertyValue]}
                                onValueChange={(v) => setFormData({...formData, propertyValue: v[0]})}
                                min={500000}
                                max={10000000}
                                step={50000}
                                className="py-4"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>₪500,000</span>
                                <span>₪10,000,000</span>
                            </div>
                        </div>

                        {/* Loan Amount */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-medium text-slate-700">סכום המשכנתא</Label>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm px-2 py-1 rounded-full ${
                                        ltv > 70 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {ltv}% מימון
                                    </span>
                                    <span className="text-xl font-bold text-blue-600">{formatCurrency(formData.loanAmount)}</span>
                                </div>
                            </div>
                            <Slider
                                value={[formData.loanAmount]}
                                onValueChange={(v) => setFormData({...formData, loanAmount: Math.min(v[0], formData.propertyValue * 0.75)})}
                                min={100000}
                                max={formData.propertyValue * 0.75}
                                step={10000}
                                className="py-4"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>₪100,000</span>
                                <span>{formatCurrency(formData.propertyValue * 0.75)} (75%)</span>
                            </div>
                        </div>

                        {/* Loan Period */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-medium text-slate-700">תקופת ההלוואה</Label>
                                <span className="text-xl font-bold text-blue-600">{formData.loanPeriod} שנים</span>
                            </div>
                            <Slider
                                value={[formData.loanPeriod]}
                                onValueChange={(v) => setFormData({...formData, loanPeriod: v[0]})}
                                min={4}
                                max={30}
                                step={1}
                                className="py-4"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>4 שנים</span>
                                <span>30 שנים</span>
                            </div>
                        </div>

                        {/* Monthly Income */}
                        <div className="space-y-3">
                            <Label className="text-base font-medium text-slate-700">הכנסה חודשית נטו (משק הבית)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={formData.monthlyIncome}
                                    onChange={(e) => setFormData({...formData, monthlyIncome: Number(e.target.value)})}
                                    className="text-lg h-14 pr-12 text-left"
                                    dir="ltr"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">₪</span>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-200 transition-all duration-300"
                        >
                            <Sparkles className="w-5 h-5 ml-2" />
                            בנה לי 3 תמהילים
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}
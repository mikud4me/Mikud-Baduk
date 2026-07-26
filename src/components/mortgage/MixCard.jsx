import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Zap, Check, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const trackTypeNames = {
    prime: "פריים",
    fixed: "קבועה לא צמודה",
    variable_5: "משתנה כל 5 שנים",
    variable_every_5: "משתנה כל 5 שנים צמודה",
    eligibility: "זכאות",
    cpi_fixed: "קבועה צמודה למדד",
    cpi_variable: "משתנה צמודה"
};

const riskConfig = {
    low: {
        label: "שמרני",
        icon: Shield,
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200"
    },
    medium: {
        label: "מאוזן",
        icon: TrendingUp,
        color: "from-brand-500 to-brand-600",
        bgColor: "bg-brand-50",
        textColor: "text-brand-700",
        borderColor: "border-brand-200"
    },
    high: {
        label: "אגרסיבי",
        icon: Zap,
        color: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200"
    }
};

export default function MixCard({ mix, index, onSelect, isSelected }) {
    const config = riskConfig[mix.risk_level] || riskConfig.medium;
    const Icon = config.icon;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
        >
            <Card className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl ${
                isSelected ? `ring-2 ring-brand-500 shadow-2xl` : 'shadow-lg hover:-translate-y-1'
            }`}
            onClick={() => onSelect(mix)}
            >
                {/* Header Gradient */}
                <div className={`h-2 bg-gradient-to-r ${config.color}`} />
                
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-mist-800">
                                    {mix.name}
                                </CardTitle>
                                <Badge className={`mt-1 ${config.bgColor} ${config.textColor} border-0`}>
                                    {config.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Monthly Payment Highlight */}
                    <div className={`p-4 rounded-2xl ${config.bgColor} ${config.borderColor} border`}>
                        <p className="text-sm text-mist-500 mb-1">החזר חודשי</p>
                        <p className={`text-3xl font-bold ${config.textColor}`}>
                            {formatCurrency(mix.monthly_payment)}
                        </p>
                    </div>

                    {/* Tracks */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-mist-500">הרכב התמהיל:</p>
                        <div className="space-y-2">
                            {mix.tracks?.map((track, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-mist-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                                        <span className="text-sm text-mist-600">{trackTypeNames[track.track_type]}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-mist-500">{track.interest_rate}%</span>
                                        <span className="font-medium text-mist-700">{formatCurrency(track.amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="text-center p-3 bg-mist-50 rounded-xl">
                            <p className="text-xs text-mist-400">סה״כ ריבית</p>
                            <p className="text-lg font-bold text-mist-700">{formatCurrency(mix.total_interest)}</p>
                        </div>
                        <div className="text-center p-3 bg-mist-50 rounded-xl">
                            <p className="text-xs text-mist-400">סה״כ לתשלום</p>
                            <p className="text-lg font-bold text-mist-700">{formatCurrency(mix.total_payment)}</p>
                        </div>
                    </div>

                    <Button 
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full h-12 ${isSelected ? `bg-gradient-to-r ${config.color} text-white border-0` : ''}`}
                    >
                        {isSelected ? (
                            <>
                                <Check className="w-4 h-4 ml-2" />
                                תמהיל נבחר
                            </>
                        ) : (
                            <>
                                בחר תמהיל זה
                                <ArrowLeft className="w-4 h-4 mr-2" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
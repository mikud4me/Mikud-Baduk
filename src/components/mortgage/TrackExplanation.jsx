import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Shield, AlertTriangle, Percent } from "lucide-react";
import { motion } from "framer-motion";

const tracks = [
    {
        id: "prime",
        name: "פריים",
        description: "הלוואה בריבית משתנה הצמודה לריבית בנק ישראל (פריים). הריבית משתנה מיידית עם כל שינוי בריבית בנק ישראל.",
        pros: ["גמישות - ניתן לפרוע ללא קנס", "בתקופות ריבית נמוכה - תשלום נמוך", "לא צמוד למדד"],
        cons: ["חשיפה לעליית ריבית", "אי וודאות בהחזר החודשי"],
        risk: "medium",
        typical_rate: "פריים + 0.5%-1%"
    },
    {
        id: "fixed",
        name: "קבועה לא צמודה (קל״צ)",
        description: "הלוואה בריבית קבועה לכל תקופת ההלוואה. הריבית והתשלום החודשי ידועים מראש.",
        pros: ["וודאות מלאה בהחזר", "הגנה מעליית ריבית", "לא צמוד למדד"],
        cons: ["ריבית התחלתית גבוהה יותר", "קנס פירעון מוקדם"],
        risk: "low",
        typical_rate: "5%-6.5%"
    },
    {
        id: "variable_5",
        name: "משתנה כל 5 שנים לא צמודה",
        description: "הריבית נקבעת מחדש כל 5 שנים לפי תנאי השוק. לא צמודה למדד המחירים.",
        pros: ["ריבית התחלתית נמוכה יותר מקבועה", "אפשרות למחזר בנקודות הזמן"],
        cons: ["אי וודאות בטווח ארוך", "סיכון לעליית ריבית משמעותית"],
        risk: "medium",
        typical_rate: "4%-5.5%"
    },
    {
        id: "cpi_fixed",
        name: "קבועה צמודה למדד (קצ״מ)",
        description: "הלוואה בריבית קבועה הצמודה למדד המחירים לצרכן. הקרן עולה עם האינפלציה.",
        pros: ["ריבית התחלתית נמוכה", "וודאות בגובה הריבית"],
        cons: ["חשיפה לאינפלציה", "הקרן גדלה עם הזמן"],
        risk: "medium",
        typical_rate: "2%-4%"
    },
    {
        id: "eligibility",
        name: "הלוואת זכאות",
        description: "הלוואה מסובסדת מהמדינה לזכאים לפי קריטריונים (נקודות זכאות, מחיר למשתכן וכו').",
        pros: ["ריבית נמוכה ביותר", "תנאים מועדפים", "הטבת מס"],
        cons: ["סכום מוגבל", "לא כולם זכאים"],
        risk: "low",
        typical_rate: "3%-4%"
    }
];

const riskColors = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700"
};

const riskLabels = {
    low: "סיכון נמוך",
    medium: "סיכון בינוני",
    high: "סיכון גבוה"
};

export default function TrackExplanation() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        מדריך מסלולי משכנתא
                    </CardTitle>
                    <p className="text-slate-500 mt-1">הכירו את סוגי המסלולים השונים ובחרו בחוכמה</p>
                </CardHeader>
                <CardContent className="pt-4">
                    <Accordion type="single" collapsible className="space-y-2">
                        {tracks.map((track) => (
                            <AccordionItem 
                                key={track.id} 
                                value={track.id}
                                className="border rounded-xl px-4 bg-white shadow-sm hover:shadow-md transition-all"
                            >
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800">{track.name}</span>
                                        <Badge className={riskColors[track.risk]}>{riskLabels[track.risk]}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                    <div className="space-y-4">
                                        <p className="text-slate-600">{track.description}</p>
                                        
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                            <Percent className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-blue-700">טווח ריבית אופייני: <strong>{track.typical_rate}</strong></span>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                                                    <Shield className="w-4 h-4" />
                                                    יתרונות
                                                </div>
                                                <ul className="space-y-1">
                                                    {track.pros.map((pro, idx) => (
                                                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                            <span className="text-emerald-500 mt-1">✓</span>
                                                            {pro}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-red-700 font-medium">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    חסרונות
                                                </div>
                                                <ul className="space-y-1">
                                                    {track.cons.map((con, idx) => (
                                                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                            <span className="text-red-500 mt-1">✗</span>
                                                            {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </motion.div>
    );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingDown, Clock, Wallet } from "lucide-react";
import { motion } from "framer-motion";

const riskLabels = {
    low: { label: "שמרני", color: "bg-emerald-100 text-emerald-700" },
    medium: { label: "מאוזן", color: "bg-blue-100 text-blue-700" },
    high: { label: "אגרסיבי", color: "bg-amber-100 text-amber-700" }
};

export default function MixComparison({ mixes }) {
    if (!mixes || mixes.length === 0) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            maximumFractionDigits: 0
        }).format(value);
    };

    const lowestPayment = Math.min(...mixes.map(m => m.monthly_payment));
    const lowestInterest = Math.min(...mixes.map(m => m.total_interest));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        השוואת תמהילים
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-right font-semibold text-slate-600">פרמטר</TableHead>
                                    {mixes.map((mix, idx) => (
                                        <TableHead key={idx} className="text-center font-semibold text-slate-600">
                                            {mix.name}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-slate-400" />
                                        החזר חודשי
                                    </TableCell>
                                    {mixes.map((mix, idx) => (
                                        <TableCell key={idx} className="text-center">
                                            <span className={`font-bold ${mix.monthly_payment === lowestPayment ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                {formatCurrency(mix.monthly_payment)}
                                            </span>
                                            {mix.monthly_payment === lowestPayment && (
                                                <Badge className="mr-2 bg-emerald-100 text-emerald-700 text-xs">הנמוך ביותר</Badge>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-slate-400" />
                                        סה״כ ריבית
                                    </TableCell>
                                    {mixes.map((mix, idx) => (
                                        <TableCell key={idx} className="text-center">
                                            <span className={`font-bold ${mix.total_interest === lowestInterest ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                {formatCurrency(mix.total_interest)}
                                            </span>
                                            {mix.total_interest === lowestInterest && (
                                                <Badge className="mr-2 bg-emerald-100 text-emerald-700 text-xs">חיסכון מקסימלי</Badge>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">סה״כ לתשלום</TableCell>
                                    {mixes.map((mix, idx) => (
                                        <TableCell key={idx} className="text-center font-bold text-slate-700">
                                            {formatCurrency(mix.total_payment)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        תקופה
                                    </TableCell>
                                    {mixes.map((mix, idx) => (
                                        <TableCell key={idx} className="text-center text-slate-600">
                                            {mix.loan_period_years} שנים
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">רמת סיכון</TableCell>
                                    {mixes.map((mix, idx) => (
                                        <TableCell key={idx} className="text-center">
                                            <Badge className={riskLabels[mix.risk_level]?.color}>
                                                {riskLabels[mix.risk_level]?.label}
                                            </Badge>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
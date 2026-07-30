import React from 'react';
import { motion } from 'framer-motion';

/**
 * DualStrategyCard — מציג שתי אסטרטגיות מחזור:
 * A: מקסימום חיסכון (קיצור שנים)
 * B: מקסימום חמצן (הפחתת החזר חודשי)
 */
export default function DualStrategyCard({ dualStrategy, currentMonthlyPayment }) {
  if (!dualStrategy) return null;
  const { strategyA, strategyB } = dualStrategy;
  const current = currentMonthlyPayment || dualStrategy.currentMonthly || 0;

  const formatNum = (n) => Math.round(n || 0).toLocaleString();
  // A תמיד עדיף מבחינת חיסכון כלכלי — B הוא "חמצן" לתזרים, לא חיסכון
  const isABetter = true;

  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-mist-100 p-5 sm:p-8 mb-6">
      {/* כותרת */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#EAF1FF', border: '1px solid #ABC7FF',
          borderRadius: '9999px', padding: '6px 16px', marginBottom: '8px'
        }}>
          <span style={{ color: '#0153F4', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
            בחר את הדרך שלך
          </span>
        </div>
        <h3 style={{ color: '#0C084A', fontSize: 'clamp(15px, 4vw, 20px)', fontWeight: 600, margin: 0 }}>2 אסטרטגיות מחזור — כל אחת לצורך אחר</h3>
        <p style={{ color: '#8E8E8E', fontSize: '13px', marginTop: '4px' }}>
          החזר נוכחי: <strong style={{ color: '#0153F4' }}>₪{formatNum(current)}</strong> — כמה רוצים לשנות?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Strategy A — מקסימום חיסכון */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: '#FFFFFF',
            border: isABetter ? '2px solid #0153F4' : '1px solid #E1E4EA',
            borderRadius: '24px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isABetter ? '0 8px 24px rgba(1,83,244,0.15)' : 'none'
          }}
        >
          {/* פס העליון תופס גובה קבוע בשני הכרטיסים כדי שהתוכן מתחתיו יתחיל באותו גובה */}
          <div style={{
            margin: '-20px -20px 12px -20px', textAlign: 'center',
            padding: '5px', fontSize: '10px', fontWeight: 900, letterSpacing: '1.5px',
            textTransform: 'uppercase',
            background: isABetter ? 'linear-gradient(90deg, #0141C2, #0153F4, #0141C2)' : 'transparent',
            color: isABetter ? '#FFFFFF' : 'transparent'
          }}>⭐ חיסכון מרבי</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
              }}>🏆</div>
              <div>
                <div style={{ color: '#16A34A', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  מקסימום חיסכון
                </div>
                <div style={{ color: '#0C084A', fontSize: '14px', fontWeight: 800 }}>קיצור שנים</div>
              </div>
            </div>

            {/* ⏱️ הבידול המרכזי של האסטרטגיה הזו */}
            {strategyA?.yearsShortened > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '10px', padding: '8px 10px', marginBottom: '10px'
              }}>
                <span style={{ fontSize: '15px' }}>⏱️</span>
                <span style={{ color: '#16A34A', fontSize: '14px', fontWeight: 900 }}>
                  קיצור של {strategyA.yearsShortened} שנים מהתקופה
                </span>
              </div>
            )}

            {/* 💰 חיסכון נטו כולל — הסטטיסטיקה המרכזית */}
            <div style={{
              background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
              border: '1px solid #BBF7D0',
              borderRadius: '12px', padding: '16px 12px', marginBottom: '10px', textAlign: 'center'
            }}>
              <div style={{ color: '#15803D', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>חיסכון נטו כולל לאורך התקופה</div>
              <div style={{ color: '#16A34A', fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 900, lineHeight: 1.1 }}>
                {(strategyA?.netSavings || 0) >= 0 ? '' : '-'}₪{formatNum(Math.abs(strategyA?.netSavings || 0))}
              </div>
            </div>

            {/* נתונים משניים */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: '#F7F8FA', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ color: '#8E8E8E', fontSize: '9px', marginBottom: '2px' }}>החזר חודשי חדש</div>
                <div style={{ color: '#0C084A', fontSize: '16px', fontWeight: 900 }}>₪{formatNum(strategyA?.monthlyPayment)}</div>
                {strategyA?.monthlyDelta !== undefined && (
                  <div style={{ fontSize: '9px', color: strategyA.monthlyDelta <= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                    {strategyA.monthlyDelta <= 0 ? `▼ ₪${formatNum(Math.abs(strategyA.monthlyDelta))} פחות` : `▲ ₪${formatNum(Math.abs(strategyA.monthlyDelta))} יותר`}
                  </div>
                )}
              </div>
              <div style={{ background: '#F7F8FA', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ color: '#8E8E8E', fontSize: '9px', marginBottom: '2px' }}>תקופה</div>
                <div style={{ color: '#0C084A', fontSize: '16px', fontWeight: 900 }}>{strategyA?.periodYears}<span style={{ fontSize: '10px', color: '#8E8E8E', marginRight: '2px' }}>שנ'</span></div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#8E8E8E', fontStyle: 'italic', textAlign: 'center' }}>
              {strategyA?.suitedFor}
            </div>
          </div>
        </motion.div>

        {/* Strategy B — מקסימום חמצן */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: '#FFFFFF',
            border: !isABetter ? '2px solid #0153F4' : '1px solid #E1E4EA',
            borderRadius: '24px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: !isABetter ? '0 8px 24px rgba(1,83,244,0.15)' : 'none'
          }}
        >
          {/* פס העליון תופס גובה קבוע בשני הכרטיסים כדי שהתוכן מתחתיו יתחיל באותו גובה */}
          <div style={{
            margin: '-20px -20px 12px -20px', textAlign: 'center',
            padding: '5px', fontSize: '10px', fontWeight: 900, letterSpacing: '1.5px',
            textTransform: 'uppercase',
            background: !isABetter ? 'linear-gradient(90deg, #0141C2, #0153F4, #0141C2)' : 'transparent',
            color: !isABetter ? '#FFFFFF' : 'transparent'
          }}>⭐ חמצן לתזרים</div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
              }}>🫁</div>
              <div>
                <div style={{ color: '#0153F4', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  מקסימום חמצן
                </div>
                <div style={{ color: '#0C084A', fontSize: '14px', fontWeight: 800 }}>הפחתת החזר</div>
              </div>
            </div>

            {/* 🪙 הבידול המרכזי של האסטרטגיה הזו */}
            {strategyB?.monthlyRelief > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '10px', padding: '8px 10px', marginBottom: '10px'
              }}>
                <span style={{ fontSize: '15px' }}>🪙</span>
                <span style={{ color: '#0153F4', fontSize: '14px', fontWeight: 900 }}>
                  ₪{formatNum(strategyB.monthlyRelief)} יותר בעו"ש כל חודש
                </span>
              </div>
            )}

            {/* 💰 חיסכון נטו כולל — הסטטיסטיקה המרכזית */}
            <div style={{
              background: (strategyB?.netSavings || 0) >= 0
                ? 'linear-gradient(135deg, #ECFDF5, #F0FDF4)'
                : 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
              border: (strategyB?.netSavings || 0) >= 0 ? '1px solid #BBF7D0' : '1px solid #FDE68A',
              borderRadius: '12px', padding: '16px 12px', marginBottom: '10px', textAlign: 'center'
            }}>
              <div style={{ color: (strategyB?.netSavings || 0) >= 0 ? '#15803D' : '#B45309', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                {(strategyB?.netSavings || 0) >= 0 ? 'חיסכון נטו כולל לאורך התקופה' : 'עלות נוספת לתקופה (מחיר ה"חמצן")'}
              </div>
              <div style={{ color: (strategyB?.netSavings || 0) >= 0 ? '#16A34A' : '#D97706', fontSize: 'clamp(26px, 7vw, 38px)', fontWeight: 900, lineHeight: 1.1 }}>
                {(strategyB?.netSavings || 0) >= 0 ? `₪${formatNum(strategyB?.netSavings)}` : `+₪${formatNum(Math.abs(strategyB?.netSavings || 0))}`}
              </div>
            </div>

            {/* נתונים משניים */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: '#F7F8FA', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ color: '#8E8E8E', fontSize: '9px', marginBottom: '2px' }}>החזר חודשי חדש</div>
                <div style={{ color: '#0C084A', fontSize: '16px', fontWeight: 900 }}>₪{formatNum(strategyB?.monthlyPayment)}</div>
              </div>
              <div style={{ background: '#F7F8FA', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ color: '#8E8E8E', fontSize: '9px', marginBottom: '2px' }}>תקופה</div>
                <div style={{ color: '#0C084A', fontSize: '16px', fontWeight: 900 }}>{strategyB?.periodYears}<span style={{ fontSize: '10px', color: '#8E8E8E', marginRight: '2px' }}>שנ'</span></div>
                <div style={{ color: '#8E8E8E', fontSize: '9px' }}>מקסימום מותר</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#8E8E8E', fontStyle: 'italic', textAlign: 'center' }}>
              {strategyB?.suitedFor}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

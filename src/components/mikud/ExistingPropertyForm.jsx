import React from 'react';
import { Home, Coins, Building2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import PremiumInput from './PremiumInput';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return '0';
  return new Intl.NumberFormat('he-IL').format(Math.round(val));
};

export default function ExistingPropertyForm({ data, onChange, errors = {} }) {
  const update = (name, value) => onChange({ ...data, [name]: value });

  const hasMortgage = data.hasExistingMortgage === 'yes';
  const isRented = data.isRented === 'yes';
  const hasSaleAgreement = data.hasSaleAgreement === 'yes';
  const isForSale = data.forSale === 'yes';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-800 text-sm">חשוב! נדרשים פרטי הנכס הקיים</p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              הבנק יבדוק את כל חובות הנכסים הקיימים שלך. פרטים מדויקים יאפשרו ניתוח מדויק של כשירותך.
            </p>
          </div>
        </div>
      </div>

      {/* פרטי הנכס */}
      <PremiumInput
        label="שווי / מחיר הנכס הקיים (₪)"
        name="existingPropertyValue"
        value={data.existingPropertyValue || ''}
        placeholder="שווי שוק / מחיר מכירה מוסכם"
        icon={Home}
        onChange={update}
        error={errors.existingPropertyValue}
        tooltip="שווי שוק נוכחי או מחיר מכירה — אותו מספר, אחד מספיק"
      />

      <PremiumInput
        label="מיקום הנכס הקיים"
        name="existingPropertyLocation"
        value={data.existingPropertyLocation || ''}
        placeholder="עיר / ישוב"
        icon={Building2}
        onChange={update}
        tooltip="מיקום הנכס משפיע על הערכת הביטחונות"
      />

      {/* משכנתא קיימת */}
      <PremiumInput
        label="האם יש משכנתא על הנכס הקיים?"
        name="hasExistingMortgage"
        value={data.hasExistingMortgage || 'no'}
        icon={Coins}
        onChange={update}
        options={[
          { val: 'no', label: 'לא — הנכס נקי מחובות' },
          { val: 'yes', label: 'כן — יש משכנתא פעילה' },
        ]}
      />

      {hasMortgage && (
        <div className="pr-4 border-r-4 border-amber-400 space-y-3 animate-in fade-in duration-200">
          <PremiumInput
            label="יתרת משכנתא על הנכס הקיים (₪)"
            name="existingMortgageBalance"
            value={data.existingMortgageBalance || ''}
            placeholder="יתרת הקרן לפירעון"
            icon={Coins}
            onChange={update}
            tooltip="יתרת המשכנתא שנשארה לשלם — הבנק יחשב זאת ב-DTI שלך"
          />
          <PremiumInput
            label="החזר חודשי על המשכנתא הקיימת (₪)"
            name="existingMortgagePayment"
            value={data.existingMortgagePayment || ''}
            placeholder="סכום החזר חודשי"
            icon={Coins}
            onChange={update}
            tooltip="ההחזר החודשי ייכלל בחישוב יחס ההחזר (DTI) שלך"
          />
          <PremiumInput
            label="שם הבנק המלווה"
            name="existingMortgageBank"
            value={data.existingMortgageBank || ''}
            placeholder="לדוגמה: לאומי, הפועלים..."
            icon={Building2}
            onChange={update}
          />

          {/* אזהרת DTI */}
          <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-bold leading-relaxed">
                הבנק יחשב את ההחזר החודשי של המשכנתא הקיימת כחלק מה-DTI שלך — 
                <strong> עד שתציג הסכם מכירה חתום</strong> על הנכס הקיים.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* האם הנכס מושכר */}
      <PremiumInput
        label="האם הנכס הקיים מושכר?"
        name="isRented"
        value={data.isRented || 'no'}
        icon={Home}
        onChange={update}
        options={[
          { val: 'no', label: 'לא — ריק / לשימוש עצמי' },
          { val: 'yes', label: 'כן — מושכר לשוכר' },
        ]}
      />

      {isRented && (
        <div className="pr-4 border-r-4 border-green-400 animate-in fade-in duration-200">
          <PremiumInput
            label="שכירות חודשית ברוטו מהנכס (₪)"
            name="rentalIncome"
            value={data.rentalIncome || ''}
            placeholder="הכנסה חודשית מהשכרה"
            icon={Coins}
            onChange={update}
            tooltip="הכנסת שכירות מחזקת את כשירותך — הבנק יוכל לקחת אותה בחשבון"
          />
        </div>
      )}

      {/* מכירת הנכס */}
      <PremiumInput
        label="האם מתכננים למכור את הנכס הקיים?"
        name="forSale"
        value={data.forSale || 'no'}
        icon={FileText}
        onChange={update}
        options={[
          { val: 'no', label: 'לא — שומרים על הנכס' },
          { val: 'yes', label: 'כן — בתכנון או בתהליך מכירה' },
        ]}
      />

      {isForSale && (
        <div className="pr-4 border-r-4 border-blue-400 space-y-3 animate-in fade-in duration-200">
          <PremiumInput
            label="האם יש הסכם מכירה חתום?"
            name="hasSaleAgreement"
            value={data.hasSaleAgreement || 'no'}
            icon={FileText}
            onChange={update}
            options={[
              { val: 'no', label: 'לא — עדיין לא נחתם הסכם' },
              { val: 'yes', label: 'כן — הסכם מכירה חתום בידי' },
            ]}
          />

          {hasSaleAgreement && (
            <div className="p-3 bg-green-50 border-2 border-green-400 rounded-xl animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-700 font-bold leading-relaxed">
                  מצוין! הסכם מכירה חתום מאפשר לבנק לנטרל את המשכנתא הקיימת מחישוב ה-DTI.
                  <strong> הגש את ההסכם יחד עם מסמכי ההלוואה.</strong>
                </p>
              </div>
            </div>
          )}

          {!hasSaleAgreement && data.hasSaleAgreement === 'no' && (
            <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl animate-in fade-in duration-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-bold leading-relaxed">
                  ללא הסכם מכירה חתום, הבנק יחשב את המשכנתא הקיימת כהתחייבות פעילה.
                  המלצה: נסה לסיים מכירה ראשונה לפני הגשת הבקשה.
                </p>
              </div>
            </div>
          )}

          <PremiumInput
            label="מחיר מכירה מוסכם / מחיר שיווק (₪)"
            name="salePrice"
            value={data.salePrice || ''}
            placeholder="מחיר הנכס במכירה"
            icon={Coins}
            onChange={update}
            tooltip="יתרת הנטו לאחר כיסוי המשכנתא הקיימת תיחשב כהון עצמי זמין"
          />
        </div>
      )}

    </div>
  );
}
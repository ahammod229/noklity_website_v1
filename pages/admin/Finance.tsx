import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Loader2, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../hooks/useCurrency';

type FinanceTxType = 'add_funds' | 'withdrawal';

interface FinanceLedgerRow {
  id: string;
  type: FinanceTxType;
  amount: number;
  note: string | null;
  created_at: string;
}

const Finance: React.FC = () => {
  const { formatCurrency, convertToBase, currencyCode, baseCurrencyCode } = useCurrency();
  const [history, setHistory] = useState<FinanceLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [note, setNote] = useState('');
  const [orderPaidTotal, setOrderPaidTotal] = useState(0);
  const [pendingClearance, setPendingClearance] = useState(0);

  const ledgerTotals = useMemo(() => {
    const added = history
      .filter((item) => item.type === 'add_funds')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const withdrawn = history
      .filter((item) => item.type === 'withdrawal')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { added, withdrawn };
  }, [history]);

  const availableBalance = orderPaidTotal + ledgerTotals.added - ledgerTotals.withdrawn;

  const toFriendlyError = (messageText: string) => {
    if (messageText.includes("Could not find the table 'public.finance_ledger'")) {
      return 'Finance table is missing in Supabase. Run latest supabase/schema.sql in SQL editor.';
    }
    return messageText;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');

    const [{ data: orderRows, error: orderError }, { data: ledgerRows, error: ledgerError }] = await Promise.all([
      supabase.from('orders').select('payment_status,total_amount'),
      supabase.from('finance_ledger').select('id,type,amount,note,created_at').order('created_at', { ascending: false }).limit(50)
    ]);

    if (orderError) {
      setError(orderError.message || 'Failed to load finance data.');
      setLoading(false);
      return;
    }

    if (ledgerError) {
      setError(toFriendlyError(ledgerError.message || 'Failed to load finance history.'));
      setHistory([]);
    } else {
      setHistory((ledgerRows || []) as FinanceLedgerRow[]);
    }

    const paid = (orderRows || [])
      .filter((row: any) => row.payment_status === 'paid')
      .reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0);
    const pending = (orderRows || [])
      .filter((row: any) => row.payment_status === 'pending')
      .reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0);

    setOrderPaidTotal(paid);
    setPendingClearance(pending);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitTransaction = async (type: FinanceTxType) => {
    setError('');
    const rawAmount = type === 'add_funds' ? addAmount : withdrawAmount;
    const amount = Number(rawAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const amountInBase = convertToBase(amount);

    if (type === 'withdrawal' && amountInBase > availableBalance) {
      setError('Withdrawal amount cannot exceed available balance.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('finance_ledger').insert({
      type,
      amount: amountInBase,
      note: note.trim() || null
    });
    setSaving(false);

    if (insertError) {
      setError(toFriendlyError(insertError.message || 'Failed to save transaction.'));
      return;
    }

    if (type === 'add_funds') setAddAmount('');
    if (type === 'withdrawal') setWithdrawAmount('');
    setNote('');
    fetchData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Finance</h2>
        <p className="text-gray-500 font-medium">Manage balance, withdrawals and finance history.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Available Balance"
          value={formatCurrency(availableBalance)}
          icon={Wallet}
          tone="blue"
        />
        <StatCard
          title="Total Withdrawn"
          value={formatCurrency(ledgerTotals.withdrawn)}
          icon={ArrowDownCircle}
          tone="red"
        />
        <StatCard
          title="Pending Clearance"
          value={formatCurrency(pendingClearance)}
          icon={ArrowUpCircle}
          tone="amber"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-4">Actions</h3>
        <p className="text-xs text-gray-500 font-semibold mb-3">
          Enter amounts in {currencyCode}. Stored in base currency: {baseCurrencyCode}.
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Withdraw amount"
              className="flex-1 h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold"
            />
            <button
              type="button"
              onClick={() => submitTransaction('withdrawal')}
              disabled={saving || loading}
              className="h-11 px-5 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Withdraw'}
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Add funds amount"
              className="flex-1 h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold"
            />
            <button
              type="button"
              onClick={() => submitTransaction('add_funds')}
              disabled={saving || loading}
              className="h-11 px-5 rounded-xl bg-green-600 text-white font-black text-sm hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Add Funds'}
            </button>
          </div>
        </div>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for this transaction"
          className="mt-3 w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm font-semibold"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900">History</h3>
        </div>
        {loading ? (
          <div className="px-6 py-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm font-bold text-gray-500">Loading finance history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm font-bold text-gray-500">
            No finance transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-widest font-black text-gray-500">Type</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-widest font-black text-gray-500">Date</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-widest font-black text-gray-500">Note</th>
                  <th className="px-6 py-3 text-[11px] uppercase tracking-widest font-black text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                          item.type === 'add_funds' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {item.type === 'add_funds' ? 'Add Funds' : 'Withdraw'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                      {item.note || '-'}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-black text-right ${
                        item.type === 'add_funds' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.type === 'add_funds' ? '+' : '-'}
                      {formatCurrency(Number(item.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  tone: 'blue' | 'red' | 'amber';
}> = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-500">{title}</p>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  );
};

export default Finance;

'use client';

import React, { useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

type Person = {
  id: string;
  name: string;
  color: string;
};

type Item = {
  id: string;
  name: string;
  price: number;
  sharedBy: string[];
  emoji: string;
};

type PersonBreakdown = {
  itemId: string;
  name: string;
  emoji: string;
  amount: number;
};

const COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-purple-500'
];

const moneyFormatter = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0
});

const EMOJI_RULES = [
  {
    emoji: '🍕',
    keywords: ['pizza', 'piza', 'พิซซ่า']
  },
  {
    emoji: '🍔',
    keywords: ['burger', 'hamburger', 'เบอร์เกอร์', 'แฮมเบอร์เกอร์']
  },
  {
    emoji: '🍟',
    keywords: ['fries', 'french fries', 'มันฝรั่งทอด']
  },
  {
    emoji: '🍗',
    keywords: ['chicken', 'ไก่', 'ไก่ทอด']
  },
  {
    emoji: '🥩',
    keywords: ['steak', 'beef', 'เนื้อ', 'สเต๊ก']
  },
  {
    emoji: '🍣',
    keywords: ['sushi', 'ซูชิ', 'ซาชิมิ', 'sashimi']
  },
  {
    emoji: '🍜',
    keywords: ['noodle', 'ramen', 'ก๋วยเตี๋ยว', 'ราเมง', 'บะหมี่', 'ผัดไทย']
  },
  {
    emoji: '🍚',
    keywords: ['rice', 'ข้าว', 'ข้าวผัด', 'กะเพรา', 'กระเพรา']
  },
  {
    emoji: '🍲',
    keywords: ['hotpot', 'shabu', 'ชาบู', 'สุกี้']
  },
  {
    emoji: '🥘',
    keywords: ['หมูกระทะ', 'bbq', 'barbecue', 'grill', 'ย่าง']
  },
  {
    emoji: '🥗',
    keywords: ['salad', 'สลัด', 'ผัก']
  },
  {
    emoji: '☕',
    keywords: ['coffee', 'latte', 'espresso', 'americano', 'กาแฟ']
  },
  {
    emoji: '🧋',
    keywords: ['milk tea', 'bubble tea', 'boba', 'ชา', 'ชานม', 'ชาไข่มุก']
  },
  {
    emoji: '🥤',
    keywords: ['soda', 'soft drink', 'coke', 'cola', 'pepsi', 'sprite', 'โค้ก', 'น้ำอัดลม']
  },
  {
    emoji: '💧',
    keywords: ['water', 'น้ำเปล่า', 'น้ำดื่ม']
  },
  {
    emoji: '🍺',
    keywords: ['beer', 'เบียร์']
  },
  {
    emoji: '🍰',
    keywords: ['cake', 'เค้ก']
  },
  {
    emoji: '🍨',
    keywords: ['ice cream', 'ไอติม', 'ไอศกรีม']
  },
  {
    emoji: '🍿',
    keywords: ['popcorn', 'ป๊อปคอร์น']
  },
  {
    emoji: '🍎',
    keywords: ['fruit', 'apple', 'ผลไม้', 'แอปเปิล']
  }
];

function getEmoji(name: string): string {
  const text = name.trim().toLowerCase();
  let bestMatch = {
    emoji: '🍽️',
    score: 0
  };

  EMOJI_RULES.forEach((rule) => {
    rule.keywords.forEach((keyword) => {
      if (!text.includes(keyword)) return;

      const score = keyword.length;

      if (score > bestMatch.score) {
        bestMatch = {
          emoji: rule.emoji,
          score
        };
      }
    });
  });

  if (bestMatch.score > 0) {
    return bestMatch.emoji;
  }

  return '🍽️';
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function formatBaht(value: number): string {
  return `฿${moneyFormatter.format(Math.round(value))}`;
}

function formatPromptPayPhone(phone: string): string {
  const cleaned = cleanPhone(phone);

  if (cleaned.length !== 10 || !cleaned.startsWith('0')) {
    return '';
  }

  return `0066${cleaned.slice(1)}`;
}

function emvField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16CcittFalse(input: string): string {
  let crc = 0xffff;

  for (let index = 0; index < input.length; index += 1) {
    crc ^= input.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function createPromptPayPayload(phone: string): string {
  const promptPayPhone = formatPromptPayPhone(phone);

  if (!promptPayPhone) {
    return '';
  }

  const merchantInfo = [
    emvField('00', 'A000000677010111'),
    emvField('01', promptPayPhone)
  ].join('');

  const fields = [
    emvField('00', '01'),
    emvField('01', '11'),
    emvField('29', merchantInfo),
    emvField('52', '0000'),
    emvField('53', '764'),
    emvField('58', 'TH')
  ].join('');

  const payloadWithoutCrc = `${fields}6304`;
  return `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}`;
}

export default function SplitBillApp() {
  const nextId = useRef(3);
  const [page, setPage] = useState<'input' | 'summary'>('input');
  const [billTitle, setBillTitle] = useState('Friday Party');
  const [people, setPeople] = useState<Person[]>([
    {
      id: '1',
      name: 'Little',
      color: COLORS[0]
    },
    {
      id: '2',
      name: 'John',
      color: COLORS[1]
    }
  ]);

  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      name: 'Pizza',
      price: 399,
      sharedBy: ['1', '2'],
      emoji: '🍕'
    }
  ]);

  const [newPerson, setNewPerson] = useState('');
  const [promptPay, setPromptPay] = useState('0812345678');

  const totalPerPerson = useMemo(() => {
    const result: Record<string, number> = {};

    people.forEach((person) => {
      result[person.id] = 0;
    });

    items.forEach((item) => {
      const validSharedBy = item.sharedBy.filter((personId) =>
        people.some((person) => person.id === personId)
      );

      if (validSharedBy.length === 0) return;

      const split = item.price / validSharedBy.length;

      validSharedBy.forEach((personId) => {
        result[personId] = (result[personId] || 0) + split;
      });
    });

    return result;
  }, [items, people]);

  const itemsByPerson = useMemo(() => {
    const result: Record<string, PersonBreakdown[]> = {};

    people.forEach((person) => {
      result[person.id] = [];
    });

    items.forEach((item) => {
      const validSharedBy = item.sharedBy.filter((personId) =>
        people.some((person) => person.id === personId)
      );

      if (validSharedBy.length === 0) return;

      const split = item.price / validSharedBy.length;

      validSharedBy.forEach((personId) => {
        result[personId]?.push({
          itemId: item.id,
          name: item.name || 'New Item',
          emoji: item.emoji,
          amount: split
        });
      });
    });

    return result;
  }, [items, people]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  const qrValue = useMemo(() => {
    return createPromptPayPayload(promptPay);
  }, [promptPay]);

  function makeId(): string {
    const id = String(nextId.current);
    nextId.current += 1;
    return id;
  }

  function addPerson() {
    const name = newPerson.trim();

    if (!name) return;

    setPeople((currentPeople) => [
      ...currentPeople,
      {
        id: makeId(),
        name,
        color: COLORS[currentPeople.length % COLORS.length]
      }
    ]);

    setNewPerson('');
  }

  function removePerson(personId: string) {
    setPeople((currentPeople) =>
      currentPeople.filter((person) => person.id !== personId)
    );

    setItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        sharedBy: item.sharedBy.filter((id) => id !== personId)
      }))
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        id: makeId(),
        name: '',
        price: 0,
        sharedBy: people.map((person) => person.id),
        emoji: '🍽️'
      }
    ]);
  }

  function removeItem(itemId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
  }

  function updateItem(
    itemId: string,
    field: 'name' | 'price',
    value: string
  ) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) return item;

        if (field === 'name') {
          return {
            ...item,
            name: value,
            emoji: getEmoji(value)
          };
        }

        return {
          ...item,
          price: Math.max(0, Number(value) || 0)
        };
      })
    );
  }

  function togglePerson(itemId: string, personId: string) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) return item;

        const isShared = item.sharedBy.includes(personId);

        return {
          ...item,
          sharedBy: isShared
            ? item.sharedBy.filter((id) => id !== personId)
            : [...item.sharedBy, personId]
        };
      })
    );
  }

  if (page === 'summary') {
    return (
      <main className="min-h-screen bg-[#f6f1e8] p-4 text-[#1f2933] sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-blue-500">
                Easy Check
              </div>
              <h1 className="mt-1 text-4xl font-black text-slate-950 sm:text-5xl">
                {billTitle.trim() || 'Untitled Bill'}
              </h1>
              <p className="mt-2 text-slate-500">
                Everyone's share for this bill
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPage('input')}
              className="rounded-2xl bg-white px-5 py-3 font-bold text-[#b45309] shadow-sm"
            >
              Back to Edit
            </button>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b pb-5">
                  <h2 className="text-3xl font-black">Report</h2>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Total</div>
                    <div className="text-3xl font-black text-[#b45309]">
                      {formatBaht(grandTotal)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {people.map((person) => (
                    <div
                      key={person.id}
                      className="rounded-3xl bg-[#fbf7ef] p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className={`${person.color} min-w-0 rounded-full px-3 py-1 font-bold text-white`}
                        >
                          <span className="block truncate">{person.name}</span>
                        </div>

                        <div className="shrink-0 text-2xl font-black">
                          {formatBaht(totalPerPerson[person.id] || 0)}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(itemsByPerson[person.id] || []).length > 0 ? (
                          itemsByPerson[person.id].map((entry) => (
                            <div
                              key={`${person.id}-${entry.itemId}`}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                            >
                              <div className="min-w-0">
                                <span className="mr-2" aria-hidden="true">
                                  {entry.emoji}
                                </span>
                                <span className="font-semibold">
                                  {entry.name}
                                </span>
                              </div>

                              <span className="shrink-0 font-bold">
                                {formatBaht(entry.amount)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-400">
                            No items selected
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-3xl font-black">Items</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#fbf7ef] px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-bold">
                          <span className="mr-2" aria-hidden="true">
                            {item.emoji}
                          </span>
                          {item.name || 'New Item'}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {item.sharedBy.length} people
                        </div>
                      </div>

                      <div className="shrink-0 text-xl font-black">
                        {formatBaht(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-3xl bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
              <h2 className="mb-5 text-3xl font-black">PromptPay</h2>
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-[#fbf7ef] p-6">
                {qrValue ? (
                  <div className="text-center">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <QRCode value={qrValue} size={220} />
                    </div>

                    <div className="mt-4 text-lg font-bold">พร้อมรับเงิน</div>
                    <div className="text-sm text-slate-500">{promptPay}</div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    Enter a valid Thai phone number
                  </div>
                )}
              </div>
            </aside>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef6ff] p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-blue-600 sm:text-5xl">
              Easy Check
            </h1>
            <p className="mt-2 text-slate-500">Split bills easily ✨</p>
          </div>

          <button
            type="button"
            onClick={() => setPage('summary')}
            className="rounded-2xl bg-blue-500 px-5 py-3 font-bold text-white"
          >
            View Summary
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-black">People</h2>
            </div>

            <div className="space-y-3">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                >
                  <div className="min-w-0">
                    <div
                      className={`${person.color} inline-flex max-w-full rounded-full px-3 py-1 font-bold text-white`}
                    >
                      <span className="truncate">{person.name}</span>
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      {formatBaht(totalPerPerson[person.id] || 0)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePerson(person.id)}
                    className="shrink-0 font-semibold text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={newPerson}
                onChange={(event) => setNewPerson(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addPerson();
                }}
                placeholder="Add friend"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={addPerson}
                className="rounded-2xl bg-blue-500 px-5 font-bold text-white"
                aria-label="Add person"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black">Items</h2>

              <button
                type="button"
                onClick={addItem}
                className="rounded-2xl bg-blue-500 px-5 py-3 font-bold text-white"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="text-3xl" aria-hidden="true">
                      {item.emoji}
                    </div>

                    <div className="min-w-0 truncate text-lg font-bold">
                      {item.name || 'New Item'}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={item.name}
                      onChange={(event) =>
                        updateItem(item.id, 'name', event.target.value)
                      }
                      placeholder="Item name"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={item.price}
                      onChange={(event) =>
                        updateItem(item.id, 'price', event.target.value)
                      }
                      placeholder="Price"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {people.map((person) => {
                      const active = item.sharedBy.includes(person.id);

                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => togglePerson(item.id, person.id)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                            active ? person.color : 'bg-slate-300'
                          }`}
                        >
                          {person.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    {item.sharedBy.length === 0 ? (
                      <span className="text-sm font-medium text-orange-500">
                        Select at least one person
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">
                        Split between {item.sharedBy.length}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="font-semibold text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-3xl font-black">Summary</h2>

            <div className="space-y-3">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4"
                >
                  <div
                    className={`${person.color} min-w-0 rounded-full px-3 py-1 font-bold text-white`}
                  >
                    <span className="block truncate">{person.name}</span>
                  </div>

                  <div className="shrink-0 text-xl font-bold">
                    {formatBaht(totalPerPerson[person.id] || 0)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-5 text-3xl font-black">
              <span>Total</span>
              <span>{formatBaht(grandTotal)}</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-3xl font-black">Bill Info</h2>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-500">
                What is this bill for?
              </span>
              <input
                value={billTitle}
                onChange={(event) => setBillTitle(event.target.value)}
                placeholder="Friday Party"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none focus:border-blue-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-500">
                PromptPay phone number
              </span>
              <input
                value={promptPay}
                onChange={(event) => setPromptPay(event.target.value)}
                placeholder="0812345678"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="button"
              onClick={() => setPage('summary')}
              className="mt-5 w-full rounded-2xl bg-blue-500 px-5 py-4 text-lg font-black text-white"
            >
              View Summary
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

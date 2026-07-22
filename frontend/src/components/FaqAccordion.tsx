import { useState } from 'react';
import styles from './FaqAccordion.module.css';
import { FaqCard } from './FaqCard';
import type { FaqItem } from '../types';

interface FaqAccordionProps {
  items: FaqItem[];
  loading: boolean;
}

export function FaqAccordion({ items, loading }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (loading) {
    return <p className={styles.status}>Carregando perguntas frequentes...</p>;
  }

  if (items.length === 0) {
    return (
      <p className={styles.status}>
        Nenhuma pergunta no FAQ corresponde à sua busca. Use o assistente de IA
        acima.
      </p>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <FaqCard
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}
    </div>
  );
}

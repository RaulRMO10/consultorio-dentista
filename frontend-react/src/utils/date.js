// /src/utils/date.js

/**
 * Converte uma data YYYY-MM-DD em string pt-BR segura contra fuso-horário
 * O `new Date('YYYY-MM-DD')` gera UTC midnight, que no Brasil vira o dia anterior às 21h.
 * Ao usar YYYY-MM-DDT00:00:00 evitamos esse deslocamento de timezone, ou processamos a string manualmente.
 */
export function formatDateBR(dateString) {
    if (!dateString) return '—';
    // Se a data já vier com hora, apenas formate
    if (dateString.includes('T') && dateString.length > 10) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    // Tratando formato YYYY-MM-DD para evitar variação de fuso
    const [year, month, day] = dateString.split('T')[0].split('-');
    if (!year || !month || !day) return dateString; // fallback se formato desconhecido

    return `${day}/${month}/${year}`;
}

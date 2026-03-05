/**
 * Utilitários para mascaramento de campos de formulário no React
 */

/**
 * Formata uma string para o padrão de CPF: 000.000.000-00
 * @param {string} value String não formatada
 * @returns {string} String formatada com máscara de CPF
 */
export const maskCPF = (value) => {
    if (!value) return '';

    // Remove tudo que não for número
    let v = value.replace(/\D/g, '');

    // Limita a 11 dígitos
    v = v.substring(0, 11);

    // Aplica a máscara
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    return v;
};

/**
 * Formata um telefone nos padrões (99) 9999-9999 (Fixo) ou (99) 99999-9999 (Celular)
 * @param {string} value String não formatada
 * @returns {string} String formatada com máscara de telefone
 */
export const maskPhone = (value) => {
    if (!value) return '';

    // Remove tudo que não for número
    let v = value.replace(/\D/g, '');

    // Limita a 11 dígitos no total (DDD + 9 dígitos)
    v = v.substring(0, 11);

    // Formatação progressiva baseada no tamanho
    if (v.length <= 10) {
        // Formato para Fixo/Celulares Antigos: (00) 0000-0000
        v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        // Formato para Celular Moderno com o nono dígito: (00) 00000-0000
        v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
        v = v.replace(/(\d{5})(\d)/, '$1-$2');
    }

    return v;
};

/**
 * Formata um CEP no padrão 00000-000
 * @param {string} value String não formatada
 * @returns {string} String formatada com máscara de CEP
 */
export const maskCEP = (value) => {
    if (!value) return '';

    // Remove tudo que não for número
    let v = value.replace(/\D/g, '');

    // Limita a 8 dígitos
    v = v.substring(0, 8);

    // Aplica a máscara 00000-000
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');

    return v;
};

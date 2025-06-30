import React from 'react';
import { Typography, Chip, Box, Tooltip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { useEmail } from '../../contexts/EmailContext';
import { Link as RouterLink } from 'react-router-dom';

// Обновленное регулярное выражение
// Последняя группа (\S+) захватывает только непробельные символы до ]
const contactRegex = /\[Контакт: (Клиент|Перевозчик) \"(.*?)\" - (.*?) (\S+)\]/g;

const RenderDescription = ({ description, onOrderClick }) => {
  const { openComposeModal } = useEmail();

  if (!description) {
    return null;
  }

  const parts = [];
  let lastIndex = 0;
  let match;

  // Регулярное выражение для номера заказа
  const orderRegex = /Заказ №(\d+)/g;

  while ((match = contactRegex.exec(description)) !== null) {
    // Добавляем текст перед контактом
    if (match.index > lastIndex) {
      let plainText = description.substring(lastIndex, match.index);
      // Заменяем номер заказа в plainText на ссылку
      if (orderRegex.test(plainText)) {
        // reset regex state
        orderRegex.lastIndex = 0;
        const segments = [];
        let ptLast = 0;
        let oMatch;
        while ((oMatch = orderRegex.exec(plainText)) !== null) {
          if (oMatch.index > ptLast) {
            segments.push(plainText.slice(ptLast, oMatch.index));
          }
          const orderId = oMatch[1];
          segments.push(
            onOrderClick ? (
              <span
                key={`order-span-${oMatch.index}`}
                onClick={(e) => {
                  e.preventDefault();
                  onOrderClick(orderId);
                }}
                style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, textDecoration: 'underline' }}
              >
                {`Заказ №${orderId}`}
              </span>
            ) : (
              <RouterLink key={`order-link-${oMatch.index}`} to={`/orders/${orderId}`} style={{ textDecoration: 'none', fontWeight: 500 }}>
                {`Заказ №${orderId}`}
              </RouterLink>
            )
          );
          ptLast = orderRegex.lastIndex;
        }
        if (ptLast < plainText.length) {
          segments.push(plainText.slice(ptLast));
        }
        parts.push(
          <Typography key={`text-before-${lastIndex}`} component="span" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {segments.map((seg, idx) => <React.Fragment key={idx}>{seg}</React.Fragment>)}
          </Typography>
        );
      } else {
        parts.push(
          <Typography key={`text-before-${lastIndex}`} component="span" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {plainText}
          </Typography>
        );
      }
    }

    // Извлекаем данные контакта
    const entityType = match[1];
    const entityName = match[2];
    const contactType = match[3];
    const contactValue = match[4];

    const isEmail = contactType.toLowerCase().includes('email');
    const isPhone = contactType.toLowerCase().includes('телефон');
    const tooltipTitle = `${entityType} \"${entityName}\"`;

    // 1. Префикс контакта (некликабельный)
    const prefixText = `[Контакт: ${entityType} \"${entityName}\" - ${contactType} `;
    parts.push(
        <Tooltip title={tooltipTitle} key={`prefix-${match.index}`}>
            {/* Используем span вместо Typography для лучшего потока с Chip */}
            <span style={{ marginRight: '4px' }}> 
                {prefixText}
            </span>
        </Tooltip>
    );

    // 2. Значение контакта (кликабельное или нет)
    if (isEmail) {
      parts.push(
        <Chip
          key={`value-${match.index}`}
          icon={<EmailIcon fontSize="inherit" sx={{ height: '16px', width: '16px' }} />}
          label={contactValue}
          size="small"
          onClick={() => openComposeModal({ to: contactValue })}
          clickable
          sx={{ mr: 0.5, mb: 0.5, verticalAlign: 'middle' }}
          variant="outlined"
        />
      );
    } else if (isPhone) {
      parts.push(
        <Chip
          key={`value-${match.index}`}
          icon={<PhoneIcon fontSize="inherit" sx={{ height: '16px', width: '16px' }} />}
          label={contactValue}
          size="small"
          component="a"
          href={`tel:${contactValue}`}
          clickable
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mr: 0.5, mb: 0.5, verticalAlign: 'middle' }}
          variant="outlined"
        />
      );
    } else {
      // Некликабельное значение (если тип не распознан)
      parts.push(
        <Typography component="span" variant="body2" key={`value-${match.index}`} sx={{ mr: 0.5 }}>
          {contactValue}
        </Typography>
      );
    }

    // 3. Суффикс (закрывающая скобка)
    parts.push(
        <span key={`suffix-${match.index}`}>
            {']'}
        </span>
    );

    lastIndex = contactRegex.lastIndex;
  }

  // Добавляем оставшийся текст
  if (lastIndex < description.length) {
    const remainingText = description.substring(lastIndex);
    const segments = [];
    let ptLast = 0;
    orderRegex.lastIndex = 0;
    let oMatch;
    while ((oMatch = orderRegex.exec(remainingText)) !== null) {
      if (oMatch.index > ptLast) {
        segments.push(remainingText.slice(ptLast, oMatch.index));
      }
      const orderId = oMatch[1];
      segments.push(
        onOrderClick ? (
          <span
            key={`order-span-rem-${oMatch.index}`}
            onClick={(e) => {
              e.preventDefault();
              onOrderClick(orderId);
            }}
            style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, textDecoration: 'underline' }}
          >
            {`Заказ №${orderId}`}
          </span>
        ) : (
          <RouterLink key={`order-link-rem-${oMatch.index}`} to={`/orders/${orderId}`} style={{ textDecoration: 'none', fontWeight: 500 }}>
            {`Заказ №${orderId}`}
          </RouterLink>
        )
      );
      ptLast = orderRegex.lastIndex;
    }
    if (ptLast < remainingText.length) {
      segments.push(remainingText.slice(ptLast));
    }
    parts.push(
      <Typography key={`text-after-${lastIndex}`} component="span" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {segments.map((seg, idx) => <React.Fragment key={idx}>{seg}</React.Fragment>)}
      </Typography>
    );
  }

  // Оборачиваем все в Box для корректной обработки переносов строк
  return <Box>{parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}</Box>;
};

export default RenderDescription; 
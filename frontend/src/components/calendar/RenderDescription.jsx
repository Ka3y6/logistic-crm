import React from 'react';
import { Typography, Chip, Box, Tooltip } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { useEmail } from '../../contexts/EmailContext';

// Обновленное регулярное выражение
// Последняя группа (\S+) захватывает только непробельные символы до ]
const contactRegex = /\[Контакт: (Клиент|Перевозчик) \"(.*?)\" - (.*?) (\S+)\]/g;

const RenderDescription = ({ description }) => {
  const { openComposeModal } = useEmail();

  if (!description) {
    return null;
  }

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = contactRegex.exec(description)) !== null) {
    // Добавляем текст перед контактом
    if (match.index > lastIndex) {
      parts.push(
        <Typography key={`text-before-${lastIndex}`} component="span" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {description.substring(lastIndex, match.index)}
        </Typography>
      );
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
    parts.push(
      <Typography key={`text-after-${lastIndex}`} component="span" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {description.substring(lastIndex)}
      </Typography>
    );
  }

  // Оборачиваем все в Box для корректной обработки переносов строк
  return <Box>{parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}</Box>;
};

export default RenderDescription; 
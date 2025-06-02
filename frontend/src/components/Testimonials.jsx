import React from 'react';
import OwlCarousel from 'react-owl-carousel';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import './Testimonials.css';

const testimonials = [
  {
    id: 1,
    name: 'Иван Петров',
    position: 'Директор по логистике',
    company: 'ООО "ТрансЛогистик"',
    text: 'Отличная система управления логистикой. Помогает эффективно контролировать все процессы и оптимизировать работу.',
    avatar: '/avatars/user1.jpg'
  },
  {
    id: 2,
    name: 'Анна Сидорова',
    position: 'Менеджер по доставке',
    company: 'ИП "Быстрая доставка"',
    text: 'Удобный интерфейс и понятная навигация. Система значительно упростила нашу работу с заказами.',
    avatar: '/avatars/user2.jpg'
  },
  {
    id: 3,
    name: 'Сергей Иванов',
    position: 'Владелец',
    company: 'ООО "Экспресс-Транс"',
    text: 'Благодаря этой системе мы смогли увеличить эффективность работы на 30%. Рекомендую всем логистическим компаниям.',
    avatar: '/avatars/user3.jpg'
  }
];

const Testimonials = () => {
  const options = {
    items: 1,
    loop: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    dots: true,
    nav: false
  };

  return (
    <div className="testimonials-container">
      <h3>Отзывы клиентов</h3>
      <OwlCarousel className="testimonial-carousel" {...options}>
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-item">
            <div className="testimonial-content">
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="author-avatar"
                />
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <p className="author-position">{testimonial.position}</p>
                  <p className="author-company">{testimonial.company}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </OwlCarousel>
    </div>
  );
};

export default Testimonials; 
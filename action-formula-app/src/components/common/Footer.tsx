export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-columns">
          <div>
            <h4 className="section-heading">Action Formula Coach</h4>
            <p className="section-subtitle">
              Инструменты и методики, которые помогают превращать знания в устойчивое действие.
            </p>
          </div>
          <div>
            <h5 className="section-heading">Ресурсы</h5>
            <ul>
              <li>
                <a href="#materials">Конспект лекции</a>
              </li>
              <li>
                <a href="#checklists">Чек-листы</a>
              </li>
              <li>
                <a href="#exercises">Упражнения</a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="section-heading">Поддержка</h5>
            <ul>
              <li>
                <a href="#faq">FAQ</a>
              </li>
              <li>
                <a href="#contacts">Связаться</a>
              </li>
              <li>
                <a href="#community">Сообщество</a>
              </li>
            </ul>
          </div>
        </div>
        <p className="footer-note">© {new Date().getFullYear()} Action Formula Coach. Все права защищены.</p>
      </div>
    </footer>
  )
}

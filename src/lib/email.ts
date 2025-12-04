import nodemailer from "nodemailer"

// Создание транспорта для Gmail
const createTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      "GMAIL_USER и GMAIL_APP_PASSWORD должны быть установлены в переменных окружения"
    )
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // App Password, не обычный пароль!
    },
  })
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    // В режиме разработки можно просто логировать
    if (process.env.NODE_ENV === "development" && !process.env.GMAIL_USER) {
      console.log("📧 Email (dev mode):", {
        to: options.to,
        subject: options.subject,
      })
      return { success: true, messageId: "dev-mode" }
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: `"EducationHub" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.subject,
      html: options.html,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

// Шаблоны писем
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Добро пожаловать в EducationHub!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Добро пожаловать в EducationHub!</h1>
            </div>
            <div class="content">
              <h2>Привет, ${name || "Пользователь"}!</h2>
              <p>Спасибо за регистрацию на нашей образовательной платформе.</p>
              <p>Теперь вы можете:</p>
              <ul>
                <li>Просматривать каталог курсов</li>
                <li>Записываться на интересующие вас курсы</li>
                <li>Отслеживать свой прогресс обучения</li>
                <li>Получать сертификаты об окончании</li>
              </ul>
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" class="button">Начать обучение</a>
              <p style="margin-top: 30px;">Если у вас есть вопросы, мы всегда готовы помочь!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EducationHub. Все права защищены.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: "Восстановление пароля EducationHub",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Восстановление пароля</h1>
            </div>
            <div class="content">
              <h2>Привет, ${name || "Пользователь"}!</h2>
              <p>Вы запросили восстановление пароля для вашего аккаунта в EducationHub.</p>
              <p>Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
              <a href="${resetLink}" class="button">Восстановить пароль</a>
              <div class="warning">
                <strong>Важно:</strong> Ссылка действительна в течение 1 часа. Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
              </div>
              <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
              <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EducationHub. Все права защищены.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  courseEnrollment: (name: string, courseTitle: string, courseLink: string) => ({
    subject: `Вы записались на курс "${courseTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Добро пожаловать на курс!</h1>
            </div>
            <div class="content">
              <h2>Привет, ${name || "Пользователь"}!</h2>
              <p>Поздравляем! Вы успешно записались на курс <strong>"${courseTitle}"</strong>.</p>
              <p>Теперь вы можете начать обучение и изучать материалы курса в удобном для вас темпе.</p>
              <a href="${courseLink}" class="button">Начать обучение</a>
              <p style="margin-top: 30px;">Удачи в обучении! 🎓</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EducationHub. Все права защищены.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  courseCompleted: (name: string, courseTitle: string, certificateLink: string) => ({
    subject: `Поздравляем! Вы завершили курс "${courseTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Поздравляем!</h1>
            </div>
            <div class="content">
              <h2>Привет, ${name || "Пользователь"}!</h2>
              <p>Отличная работа! Вы успешно завершили курс <strong>"${courseTitle}"</strong>.</p>
              <p>Ваш сертификат готов! Вы можете скачать его в личном кабинете.</p>
              <a href="${certificateLink}" class="button">Посмотреть сертификат</a>
              <p style="margin-top: 30px;">Продолжайте учиться и развиваться! 🚀</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EducationHub. Все права защищены.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}


import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Game from '#models/game'
import MinigameAnswer from '#models/minigame_answer'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Create admin user if not exists
    const adminEmail = 'admin@puzzle-minigames.local'
    const existingAdmin = await User.findBy('email', adminEmail)
    
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: 'Admin@123456', // Should be changed in production
        fullName: 'System Administrator',
        isAdmin: true,
        isEmailVerified: true,
        isPhoneVerified: false,
      })
      console.log('✓ Admin user created:', adminEmail)
    }

    // Insert games
    await Game.updateOrCreateMany('name', [
      {
        name: 'Main Puzzle',
        description: 'اینفرنال - پازل اصلی سودوکو ۳×۳',
        difficulty: 'medium',
      },
      {
        name: 'Mirror Game',
        description: 'بازی آینه - حل معمای کلمات',
        difficulty: 'medium',
      },
      {
        name: 'Weight Ball Game',
        description: 'بازی وزن توپ سفید',
        difficulty: 'easy',
      },
      {
        name: 'Basketball Game',
        description: 'بازی رد نهان - پیدا کردن مسیر حرکت',
        difficulty: 'hard',
      },
    ])

    // Insert minigame answers
    await MinigameAnswer.updateOrCreateMany(['minigameName', 'answerKey'], [
      {
        minigameName: 'mirror',
        answerKey: 'password',
        answerValue: 'حقیقت در سکوت است',
        requiresAdminVerification: false,
        isActive: true,
      },
      {
        minigameName: 'mirror',
        answerKey: 'word_order',
        answerValue: JSON.stringify({ top: 'Zoom', middle: 'Escape', bottom: 'Infernal' }),
        requiresAdminVerification: false,
        isActive: true,
      },
      {
        minigameName: 'weight',
        answerKey: 'white_ball_weight',
        answerValue: '4',
        requiresAdminVerification: false,
        isActive: true,
      },
      {
        minigameName: 'basketball',
        answerKey: 'combination',
        answerValue: '', // This will be set by admin as it may vary
        requiresAdminVerification: true,
        isActive: true,
      },
    ])
  }
}

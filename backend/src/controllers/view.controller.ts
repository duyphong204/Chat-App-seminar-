import { Request, Response } from 'express'

export const renderHome = (req: Request, res: Response) => {
    try {
        const user = (req as any).user || null
        res.render('index', {
            title: 'Trang chủ - Chat App',
            user: user
        })
    } catch (error) {
        console.error('Lỗi khi render trang:', error)
        res.status(500).send('Lỗi khi render trang')
    }
}

export const renderLogin = (req: Request, res: Response) => {
    try {
        res.render('login', {
            title: 'Đăng Nhập - Chat App'
        })
    } catch (error) {
        console.error('Lỗi khi render trang đăng nhập:', error)
        res.status(500).send('Lỗi khi render trang đăng nhập')
    }
}

export const renderRegister = (req: Request, res: Response) => {
    try {
        res.render('register', {
            title: 'Đăng Ký - Chat App'
        })
    } catch (error) {
        console.error('Lỗi khi render trang đăng ký:', error)
        res.status(500).send('Lỗi khi render trang đăng ký')
    }
}

export const renderChat = (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        if (!user) {
            return res.redirect('/login')
        }
        res.render('chat', {
            title: 'Chat - Chat App',
            user: user
        })
    } catch (error) {
        console.error('Lỗi khi render trang chat:', error)
        res.status(500).send('Lỗi khi render trang chat')
    }
}



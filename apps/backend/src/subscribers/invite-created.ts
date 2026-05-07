import { INotificationModuleService, IUserModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { BACKEND_URL } from '../lib/constants'
import { EmailTemplates } from '@calilean/plugin-email/providers/email-notifications/templates'

export default async function userInviteHandler({
    event: { data },
    container,
  }: SubscriberArgs<any>) {

  const logger = container.resolve("logger")
  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION,
  )
  const userModuleService: IUserModuleService = container.resolve(Modules.USER)
  const invite = await userModuleService.retrieveInvite(data.id)

  try {
    await notificationModuleService.createNotifications({
      to: invite.email,
      channel: 'email',
      template: EmailTemplates.INVITE_USER,
      data: {
        emailOptions: {
          replyTo: 'hello@calilean.com',
          subject: "You've been invited to Cali Lean",
        },
        inviteLink: `${BACKEND_URL}/app/invite?token=${invite.token}`,
        preview: 'The administration dashboard awaits...'
      }
    })
  } catch (error) {
    logger.error('Error sending invite notification:', error)
  }
}

export const config: SubscriberConfig = {
  event: ['invite.created', 'invite.resent']
}

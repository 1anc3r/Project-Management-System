/**
 * 附件访问控制（ACL）
 *
 * 背景：POST /api/attachments/access-tokens 会签发绑定单个文件的短期访问凭证
 * （kind: 'id'），若签发前不校验归属，任意登录用户即可通过枚举 id 批量获取
 * 任意附件的下载/预览权限（IDOR）。
 *
 * 可见性规则与各业务控制器保持一致：
 *   - admin / global：可见全部
 *   - normal：仅可见自己创建的项目 / 商机下的附件
 *   - 关联到知识库（knowledge_id）的附件：知识库为全员可见内容，放行
 *   - 未关联任何业务实体的附件（富文本编辑器上传的图片）：任何登录用户可预览，
 *     凭证仍为 30 分钟、绑定单个文件、不能用于其他文件
 */

const { query } = require('../config/db');

/** 可查看全部数据的角色 */
const GLOBAL_ROLES = ['admin', 'global'];

/**
 * 判断用户是否有权访问某附件
 * @param {{userId: number|string, role: string}} user - 当前登录用户
 * @param {{project_id?: number|null, knowledge_id?: number|null, opportunity_id?: number|null}} att - 附件的业务归属
 * @returns {Promise<boolean>} 是否有权访问
 */
const canAccessAttachment = async (user, att) => {
  if (!user) return false;
  if (GLOBAL_ROLES.includes(user.role)) return true;
  if (!att) return false;

  // 知识库内容全员可见
  if (att.knowledge_id) return true;

  // 项目附件：normal 仅可见自建项目
  if (att.project_id) {
    const rows = await query(
      'SELECT created_by FROM projects WHERE id = ? LIMIT 1',
      [att.project_id]
    );
    if (rows.length === 0) return false;
    return rows[0].created_by === user.userId;
  }

  // 商机附件：normal 仅可见自建商机
  if (att.opportunity_id) {
    const rows = await query(
      'SELECT created_by FROM opportunities WHERE id = ? LIMIT 1',
      [att.opportunity_id]
    );
    if (rows.length === 0) return false;
    return rows[0].created_by === user.userId;
  }

  // 未关联业务实体（编辑器上传的图片）：登录用户可预览
  return true;
};

module.exports = {
  canAccessAttachment,
  GLOBAL_ROLES
};

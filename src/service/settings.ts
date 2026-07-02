import ExecutiveDao from "@/dao/executive";
import { ExecutiveRole } from "@/helpers/auth-user";

const SettingsService = {
  async getExecutivesWithRoles() {
    return await ExecutiveDao.findAll();
  },
  async updateExecutiveRole(id: string, role: ExecutiveRole) {
    const executive = await ExecutiveDao.findById(id);
    if (!executive) {
      throw new Error("Executive not found");
    }
    return await ExecutiveDao.updateExecutive(id, { role });
  },
};

export default SettingsService;

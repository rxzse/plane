import sortBy from "lodash/sortBy";
// helpers
import { satisfiesDateFilter } from "helpers/filter.helper";
// types
import { IModule, TModuleDisplayFilters, TModuleFilters, TModuleOrderByOptions } from "@plane/types";

/**
 * @description orders modules based on their status
 * @param {IModule[]} modules
 * @param {TModuleOrderByOptions | undefined} orderByKey
 * @returns {IModule[]}
 */
export const orderModules = (modules: IModule[], orderByKey: TModuleOrderByOptions | undefined): IModule[] => {
  let orderedModules: IModule[] = [];
  if (modules.length === 0 || !orderByKey) return [];

  if (orderByKey === "name") orderedModules = sortBy(modules, [(m) => m.name.toLowerCase()]);
  if (orderByKey === "-name") orderedModules = sortBy(modules, [(m) => m.name.toLowerCase()]).reverse();
  if (["progress", "-progress"].includes(orderByKey))
    orderedModules = sortBy(modules, [
      (m) => {
        let progress = (m.completed_issues + m.cancelled_issues) / m.total_issues;
        if (isNaN(progress)) progress = 0;
        return orderByKey === "progress" ? progress : !progress;
      },
      "name",
    ]);
  if (["issues_length", "-issues_length"].includes(orderByKey))
    orderedModules = sortBy(modules, [
      (m) => (orderByKey === "issues_length" ? m.total_issues : !m.total_issues),
      "name",
    ]);
  if (orderByKey === "target_date") orderedModules = sortBy(modules, [(m) => m.target_date]);
  if (orderByKey === "-target_date") orderedModules = sortBy(modules, [(m) => !m.target_date]);
  if (orderByKey === "created_at") orderedModules = sortBy(modules, [(m) => m.created_at]);
  if (orderByKey === "-created_at") orderedModules = sortBy(modules, [(m) => !m.created_at]);

  return orderedModules;
};

/**
 * @description filters modules based on the filters
 * @param {IModule} module
 * @param {TModuleDisplayFilters} displayFilters
 * @param {TModuleFilters} filters
 * @returns {boolean}
 */
export const shouldFilterModule = (
  module: IModule,
  displayFilters: TModuleDisplayFilters,
  filters: TModuleFilters
): boolean => {
  let fallsInFilters = true;
  Object.keys(filters).forEach((key) => {
    const filterKey = key as keyof TModuleFilters;
    if (filterKey === "status" && filters.status && filters.status.length > 0)
      fallsInFilters = fallsInFilters && filters.status.includes(module.status.toLowerCase());
    if (filterKey === "lead" && filters.lead && filters.lead.length > 0)
      fallsInFilters = fallsInFilters && filters.lead.includes(`${module.lead_id}`);
    if (filterKey === "members" && filters.members && filters.members.length > 0) {
      const memberIds = module.member_ids;
      fallsInFilters = fallsInFilters && filters.members.some((memberId) => memberIds.includes(memberId));
    }
    if (filterKey === "start_date" && filters.start_date && filters.start_date.length > 0) {
      filters.start_date.forEach((dateFilter) => {
        fallsInFilters =
          fallsInFilters && !!module.start_date && satisfiesDateFilter(new Date(module.start_date), dateFilter);
      });
    }
    if (filterKey === "target_date" && filters.target_date && filters.target_date.length > 0) {
      filters.target_date.forEach((dateFilter) => {
        fallsInFilters =
          fallsInFilters && !!module.target_date && satisfiesDateFilter(new Date(module.target_date), dateFilter);
      });
    }
  });
  if (displayFilters.favorites && !module.is_favorite) fallsInFilters = false;

  return fallsInFilters;
};

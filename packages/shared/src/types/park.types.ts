/**
 * 파크 관련 타입 정의
 */

import { BaseEntity } from './common.types';

export interface Park extends BaseEntity {
  userId: string;
  name: string;
  level: number;
  exp: number;
  gridSizeX: number;
  gridSizeY: number;
  totalRevenue: number;
  totalVisitors: number;
}

export interface ParkStats {
  dinosaurCount: number;
  buildingCount: number;
  greatFigureCount: number;
  hourlyRevenue: number;
  hourlyMaintenance: number;
  netRevenue: number;
  popularity: number;
  satisfaction: number;
}

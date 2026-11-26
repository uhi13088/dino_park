import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PARK_SHUTTLE, type SetShuttleRouteRequest } from '@dino-park/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ResourcesService } from '../resources/resources.service';
import { admissionResearch, admissionSnapshot } from './park-admission.logic';
import { ParkOperationsService } from './park-operations.service';
import { readShuttleService } from './park-shuttle.logic';

type Tx = Prisma.TransactionClient;

@Injectable()
export class ParkShuttleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
    private readonly resources: ResourcesService,
  ) {}

  buyVehicle(userId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const { park, shuttle } = await this.readForChange(tx, userId);
      const saved = readShuttleService(park.shuttleService);
      if (!saved.requestIds.includes(requestId)) {
        if (shuttle.unavailableReason) throw new BadRequestException(shuttle.unavailableReason);
        if (saved.requestIds.length >= PARK_SHUTTLE.maxBuses)
          throw new BadRequestException(
            `셔틀버스는 ${PARK_SHUTTLE.maxBuses}대까지 보유할 수 있어요.`,
          );
        await this.resources.spendGold(tx, userId, PARK_SHUTTLE.purchaseGold, '셔틀버스 구매');
        saved.requestIds.push(requestId);
        await tx.park.update({ where: { id: park.id }, data: { shuttleService: saved } });
      }
      return this.operations.readOperationsInTransaction(tx, userId);
    });
  }

  setRoute(userId: string, exhibitId: string, config: SetShuttleRouteRequest) {
    return this.prisma.$transaction(async (tx) => {
      const { park, shuttle } = await this.readForChange(tx, userId);
      const saved = readShuttleService(park.shuttleService);
      const original = saved.routes.find((route) => route.exhibitId === exhibitId);
      if (config.busCount > 0) {
        if (shuttle.unavailableReason) throw new BadRequestException(shuttle.unavailableReason);
        const destination = shuttle.destinations.find((item) => item.exhibitId === exhibitId);
        if (!destination || destination.distance === null)
          throw new BadRequestException('정문에서 관람길로 연결된 먼 전시를 골라주세요.');
        if (!original && saved.routes.length >= PARK_SHUTTLE.maxRoutes)
          throw new BadRequestException(
            `셔틀버스는 ${PARK_SHUTTLE.maxRoutes}개 노선까지 배정할 수 있어요.`,
          );
        if (config.busCount > shuttle.unassignedBusCount + (original?.busCount ?? 0))
          throw new BadRequestException('다른 노선에서 차량을 회수하거나 셔틀버스를 구매해주세요.');
      }
      const changed =
        config.busCount > 0
          ? config.busCount !== original?.busCount ||
            config.departureIntervalSeconds !== original.departureIntervalSeconds
          : !!original;
      if (changed) {
        saved.routes = saved.routes.filter((route) => route.exhibitId !== exhibitId);
        if (config.busCount > 0) saved.routes.push({ exhibitId, ...config });
        await tx.park.update({ where: { id: park.id }, data: { shuttleService: saved } });
      }
      return this.operations.readOperationsInTransaction(tx, userId);
    });
  }

  private async readForChange(tx: Tx, userId: string) {
    const { settledAt } = await this.operations.settleInTransaction(tx, userId, true);
    const park = await tx.park.findUniqueOrThrow({
      where: { userId },
      include: { buildings: true, dinosaurs: true, technologyResearch: admissionResearch },
    });
    const { shuttle } = admissionSnapshot(park, settledAt.getTime());
    return { park, shuttle: shuttle.state };
  }
}

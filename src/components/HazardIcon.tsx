'use client';

import React from 'react';
import {
  MountainSnow,
  Layers,
  Droplets,
  BrickWall,
  TrainTrack,
  Trees,
  AlertTriangle,
  LucideProps,
} from 'lucide-react';
import { HazardType } from '@/lib/types';

export const HAZARD_ICON_MAP: Record<
  HazardType,
  React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>
> = {
  slip: MountainSnow,
  rockfall: Layers,
  blocked_drain: Droplets,
  damaged_wall: BrickWall,
  track_defect: TrainTrack,
  vegetation: Trees,
  other: AlertTriangle,
};

interface HazardIconProps extends LucideProps {
  type: HazardType | string;
}

export default function HazardIcon({ type, className = '', ...props }: HazardIconProps) {
  const norm = (type || 'other').toLowerCase() as HazardType;
  const IconComponent = HAZARD_ICON_MAP[norm] || AlertTriangle;

  return <IconComponent className={className} {...props} />;
}

using System.Collections.Generic;
using UnityEngine;

namespace FireWing.Data
{
    /// <summary>Per-aircraft aerodynamic, engine, control, stall, and balance tuning curves.</summary>
    [CreateAssetMenu(menuName = "FireWing/Aircraft Flight Profile")]
    public sealed class AircraftFlightProfile : ScriptableObject
    {
        /// <summary>Stable profile identifier used by the asset catalog.</summary>
        public string id;

        /// <summary>Human-readable profile name.</summary>
        public string displayName;

        /// <summary>Lift coefficient by angle of attack in degrees.</summary>
        public AnimationCurve liftCoefficientByAoA = new AnimationCurve(
            new Keyframe(-20f, -0.7f), new Keyframe(-8f, -0.45f), new Keyframe(0f, 0.2f),
            new Keyframe(10f, 1.25f), new Keyframe(15f, 1.5f), new Keyframe(20f, 0.5f));

        /// <summary>Drag coefficient by angle of attack in degrees.</summary>
        public AnimationCurve dragCoefficientByAoA = new AnimationCurve(
            new Keyframe(-20f, 0.22f), new Keyframe(-8f, 0.055f), new Keyframe(0f, 0.03f),
            new Keyframe(10f, 0.065f), new Keyframe(15f, 0.16f), new Keyframe(20f, 0.34f));

        /// <summary>Pitch control effectiveness by airspeed in meters per second.</summary>
        public AnimationCurve pitchControlEffectivenessBySpeed = AnimationCurve.Linear(0f, 0.15f, 100f, 1f);

        /// <summary>Roll control effectiveness by airspeed in meters per second.</summary>
        public AnimationCurve rollControlEffectivenessBySpeed = AnimationCurve.Linear(0f, 0.08f, 100f, 1f);

        /// <summary>Yaw control effectiveness by airspeed in meters per second.</summary>
        public AnimationCurve yawControlEffectivenessBySpeed = AnimationCurve.Linear(0f, 0.12f, 100f, 1f);

        /// <summary>Available engine power fraction by altitude in meters.</summary>
        public AnimationCurve enginePowerByAltitude = new AnimationCurve(
            new Keyframe(0f, 1f), new Keyframe(3000f, 0.88f), new Keyframe(6000f, 0.68f), new Keyframe(10000f, 0.4f));

        /// <summary>Propeller efficiency by airspeed in meters per second.</summary>
        public AnimationCurve propellerEfficiencyBySpeed = new AnimationCurve(
            new Keyframe(0f, 0.62f), new Keyframe(25f, 0.82f), new Keyframe(60f, 0.91f), new Keyframe(110f, 0.72f));

        /// <summary>Jet thrust fraction by airspeed in meters per second.</summary>
        public AnimationCurve thrustBySpeed = new AnimationCurve(
            new Keyframe(0f, 1f), new Keyframe(100f, 1f), new Keyframe(200f, 0.92f), new Keyframe(300f, 0.76f));

        /// <summary>Throttle spool time in seconds from idle to full power.</summary>
        [Min(0.05f)] public float throttleSpoolSeconds = 1.2f;

        /// <summary>Selectable flap stages in order from retracted to full flap.</summary>
        public List<FlapSetting> flapSettings = new List<FlapSetting> { new FlapSetting() };

        /// <summary>Additional drag coefficient with landing gear extended.</summary>
        [Min(0f)] public float gearDragCoefficient = 0.035f;

        /// <summary>Angle of attack in degrees where the aircraft begins to stall.</summary>
        [Range(5f, 30f)] public float stallAngleDegrees = 15f;

        /// <summary>Sharpness of lift loss after the stall angle.</summary>
        [Min(0.1f)] public float stallSharpness = 0.22f;

        /// <summary>Strength of asymmetric wing drop during a stall, from zero to one.</summary>
        [Range(0f, 1f)] public float wingDropTendency = 0.25f;

        /// <summary>Strength of spin entry during a stalled, yawed condition, from zero to one.</summary>
        [Range(0f, 1f)] public float spinTendency = 0.15f;

        /// <summary>Power-induced yaw tendency for a single-engine propeller aircraft.</summary>
        public float engineTorqueYaw = 0.08f;

        /// <summary>Power-induced roll tendency for a single-engine propeller aircraft.</summary>
        public float engineTorqueRoll = 0.12f;

        /// <summary>Additional elevator and rudder authority from prop wash at low speed.</summary>
        [Min(0f)] public float propWashControlBoost = 0.2f;

        /// <summary>Yaw moment multiplier when one engine fails on a multi-engine aircraft.</summary>
        [Min(0f)] public float engineOutAsymmetryStrength = 0.18f;

        /// <summary>Roll, pitch, and yaw inertia multipliers relative to the base rigidbody.</summary>
        public Vector3 inertiaTensorScale = Vector3.one;

        /// <summary>Local center-of-gravity offset in meters.</summary>
        public Vector3 centerOfGravityOffset;

        /// <summary>Pitch trim impulse per kilogram of payload released.</summary>
        public float dropCenterOfGravityPitchShift = 0.0004f;

        /// <summary>Propeller static-thrust cap as a fraction of rated engine thrust.</summary>
        [Range(0.1f, 2f)] public float staticThrustFraction = 0.9f;

        /// <summary>Ground-effect lift bonus at zero height above ground.</summary>
        [Range(0f, 0.5f)] public float groundEffectStrength = 0.12f;

        /// <summary>Height above ground in meters where ground effect reaches zero.</summary>
        [Min(0.1f)] public float groundEffectHeightMeters = 12f;
    }
}
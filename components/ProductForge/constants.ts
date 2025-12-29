export const PRODUCT_OPTIONS = {
  materials: [
    { id: 'silicone_medical', label: '医用级硅胶 (液态)', desc: '低致敏，触感柔软，高档质感' },
    { id: 'tpe_cyberskin', label: 'TPE / 仿肤材质', desc: '逼真纹理，多孔，需定期保养' },
    { id: 'abs_plastic', label: '高光 ABS 塑料', desc: '坚硬，耐用，经济实惠，易清洁' },
    { id: 'metal_alloy', label: '锌合金 / 不锈钢', desc: '温控响应快，有分量感，奢华' },
    { id: 'borosilicate', label: '高硼硅玻璃', desc: '适合温控玩法，坚硬，低致敏' },
    { id: 'phase_change', label: '相变温控材料', desc: '自动调节表面温度，提升真实感，智能恒温' },
    { id: 'liquid_silicone_rubber', label: 'LSR液态硅橡胶', desc: '耐高温、超柔软、极低致敏性，医疗级标准' },
    { id: 'antibacterial_silicone', label: '抗菌硅胶', desc: '添加银离子抗菌剂，抑制细菌生长' },
  ],
  // 驱动系统
  driveComponents: [
    { id: 'dual_motor', label: '双独立马达', desc: '高震动多样性，多频体验' },
    { id: 'micro_dc_motor', label: '微型直流有刷/无刷马达', desc: '成本低，配合偏心轮，转速3000–9000rpm，噪音40–60dB' },
    { id: 'coreless_motors', label: '微型直流空心杯马达', desc: '中高端首选，体积小、转速高、响应快、噪音低' },
    { id: 'linear_actuator', label: '线性推杆', desc: '机械往复运动，高功耗，适合伸缩功能' },
    { id: 'linear_resonant_actuators', label: '线性马达 (LRA)', desc: '高端产品，细腻定向反馈，模拟心跳/呼吸节奏' },
    { id: 'sonic_wave', label: '声波吸吮技术（气泵）', desc: '非接触刺激，气压脉冲，需配合硅胶腔体' },
  ],
  
  // 主控系统
  controlComponents: [
    { id: 'mcu_8bit', label: '8位MCU单片机', desc: '低成本方案，处理简单按键和PWM调速' },
    { id: 'mcu_32bit', label: '32位MCU单片机', desc: '主流方案，支持复杂算法和蓝牙通信' },
    { id: 'soc', label: '高集成度SoC芯片', desc: '集成MCU+蓝牙+音频，减少外围元件' },
    { id: 'voice_recognition', label: '专用语音识别芯片', desc: '支持语音交互，可替代MCU+语音模块' },
    { id: 'aiot', label: '低功耗AIoT芯片', desc: '本地化AI计算，适用于智能伴侣产品' },
  ],
  
  // 加热系统
  heatingComponents: [
    { id: 'ptc_heater', label: 'PTC陶瓷加热片', desc: '自限温特性，安全可靠，功率5-15W' },
    { id: 'graphene_heating', label: '石墨烯加热膜', desc: '升温快、均匀，柔性可弯曲，高端首选' },
    { id: 'peltier', label: '半导体制冷/加热片', desc: '可加热可制冷，双向温控技术' },
    { id: 'ntc_resistor', label: 'NTC热敏电阻+加热膜', desc: '实时温度监控，防烫伤保护' },
  ],
  
  // 传感器系统
  sensorComponents: [
    { id: 'capacitive_touch', label: '电容式触摸传感器', desc: '替代实体按键，隐藏于硅胶内，利于防水' },
    { id: 'pressure_sensor', label: '压力传感器', desc: '柔性薄膜，感知按压力度和抚摸轨迹' },
    { id: 'vibration_switch', label: '振动/晃动开关', desc: '弹簧式机械开关，晃动触发，成本极低' },
    { id: 'temperature_sensor', label: '温度传感器', desc: '配合加热系统，实现38-42℃恒温控制' },
    { id: 'bio_signal_sensor', label: '生物信号传感器', desc: '心率/皮电监测，动态调整刺激强度，高端应用' },
    { id: 'hall_sensor', label: '霍尔传感器', desc: '检测磁场变化，用于无接触位置/速度检测' },
    { id: 'imu_sensor', label: 'IMU惯性测量单元', desc: '如MPU6050、LSM6DS3等，捕捉抽动、姿势、动作等' },
    { id: 'emg_sensor', label: 'EMG肌电传感器', desc: '更底层、更精准的生物电检测，多用于康复或极客产品；需直接接触皮肤，对汗液、位置敏感，信号处理复杂，成本高' },
    { id: 'eit_sensor', label: 'EIT柔性电阻抗肌力传感器', desc: '无创、高灵敏度、可贴合曲面、抗运动伪影；需精密电路设计；尚未大规模商用' },
  ],
  
  // 电源系统
  powerComponents: [
    { id: 'li_po_300', label: '300mAh锂聚合物电池', desc: '小型产品，续航1-2小时' },
    { id: 'li_po_600', label: '600mAh锂聚合物电池', desc: '中型产品，续航2-4小时' },
    { id: 'li_po_1000', label: '1000mAh锂聚合物电池', desc: '大型产品，续航4-6小时' },
    { id: 'battery_protection', label: '电池保护板', desc: '防过充/过放/短路，必配安全组件' },
    { id: 'usb_charging', label: 'USB充电电路', desc: '标准TypeC/MicroUSB接口，5V充电' },
    { id: 'wireless_charging', label: '无线充电模块 (Qi)', desc: '提升防水性和外观，成本较高' },
    { id: 'battery_monitor', label: '电量检测芯片', desc: '低电量提醒，自动关机保护' },
  ],
  
  // 设备辅助
  accessories: [
    { id: 'wristband', label: '手环', desc: '智能手环辅助控制，心率监测联动' },
    { id: 'smartphone', label: '手机APP', desc: '蓝牙连接，远程控制，数据记录分析' },
    { id: 'vr_headset', label: 'VR头显', desc: '沉浸式体验，视听触觉多感官联动' },
    { id: 'smart_speaker', label: '智能音箱', desc: '语音控制，情境模式切换' },
    { id: 'remote_control', label: '无线遥控器', desc: '简易操作，适合非智能手机用户' },
  ],
  colors: [
    // 经典色系
    { id: 'midnight_black', label: '午夜黑', hex: '#000000' },
    { id: 'pure_white', label: '纯净白', hex: '#FFFFFF' },
    { id: 'champagne_gold', label: '香槟金', hex: '#F7E7CE' },
    { id: 'rose_gold', label: '玫瑰金', hex: '#B76E79' },
    // 莫兰迪色系（高级温暖）
    { id: 'morandi_grey_pink', label: '莫兰迪灰粉', hex: '#D4B5B0' },
    { id: 'morandi_mist_blue', label: '莫兰迪雾蓝', hex: '#A6B8C1' },
    { id: 'morandi_bean_green', label: '莫兰迪豆沙绿', hex: '#B8C5B8' },
    { id: 'morandi_oat_white', label: '莫兰迪燕麦白', hex: '#E8E0D5' },
    { id: 'morandi_mauve', label: '莫兰迪藕粉', hex: '#D6C9C3' },
    // 时尚色系
    { id: 'blush_pink', label: '羞涩粉', hex: '#FFB6C1' },
    { id: 'deep_purple', label: '深邃紫', hex: '#4B0082' },
    { id: 'teal_gradient', label: '青蓝渐变', hex: '#008080' },
    { id: 'ruby_red', label: '宝石红', hex: '#E0115F' },
    { id: 'lavender', label: '薰衣草紫', hex: '#E6E6FA' },
  ],
  processes: [
    { id: 'double_shot', label: '双色注塑', desc: '硬胶与软胶一体成型' },
    { id: 'soft_touch', label: '手感油喷涂', desc: '硬塑料上的丝绒哑光触感' },
    { id: 'seamless_silicone', label: '全包胶无缝工艺', desc: '内部骨架完全包裹，防水' },
    { id: 'cnc_machining', label: 'CNC 精密加工', desc: '金属精密切割与抛光' },
    { id: 'iml_diamond', label: 'IML模内镶钻', desc: '薄膜转印+镶嵌工艺，奢华外观，耐磨' },
    { id: 'high_gloss_injection', label: '高光注塑', desc: '镜面光泽效果，高端质感，无需喷涂' },
    { id: 'pvd_coating', label: 'PVD真空镀膜', desc: '金属表面物理气相沉积，耐磨耐腐蚀' },
    { id: 'uv_coating', label: 'UV光固化涂层', desc: '快速固化，高硬度保护层，防刮花' },
    { id: 'laser_etching', label: '激光蚀刻', desc: '精密图案雕刻，永久标记，高端定制' },
  ],
  
  // 图纹/纹理
  textures: [
    // 功能性纹理
    { id: 'anti_slip_stripes', label: '防滑条纹', desc: '增强握持力，防止手滑' },
    { id: 'massage_bumps', label: '按摩凸点', desc: '刺激触觉神经，增强快感' },
    { id: 'biomimetic_folds', label: '仿生褶皱', desc: '模拟真实腔道，高度逼真' },
    { id: 'ribbed_texture', label: '螺旋肋纹', desc: '增强摩擦感，层次刺激' },
    // 装饰性纹理
    { id: 'geometric_lines', label: '几何线条', desc: '简约现代，科技美感' },
    { id: 'brand_emblem', label: '品牌符号', desc: '凸显品牌识别度，高端定位' },
    { id: 'asmr_whisper_wave', label: 'ASMR耳语波纹', desc: '微妙触感肌理，舒缓放松' },
    { id: 'floral_pattern', label: '花卉纹样', desc: '优雅浪漫，适合女性审美' },
    // 隐藏式设计
    { id: 'led_3d_leather', label: '3D皮革溢彩流光', desc: '灯光透过纹理，使用时才显现，平时隐藏' },
    { id: 'thermochromic_pattern', label: '温变显色图案', desc: '触摸加热后显现隐藏图案' },
  ],
  protocols: [
    { id: 'ble_5', label: '蓝牙 LE 5.2', desc: 'App 智能控制，低功耗' },
    { id: 'rf_433', label: '射频 433MHz', desc: '远距离遥控，无需 App' },
    { id: 'wifi_6', label: 'Wi-Fi 6 (IoT)', desc: '远程异地交互，高带宽' },
    { id: 'zigbee', label: 'Zigbee/Matter', desc: '智能家居生态集成' },
    { id: 'none', label: '独立运行 (无无线)', desc: '简单按键界面，绝对隐私安全' },
  ],
};

